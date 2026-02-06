<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import draggable from 'vuedraggable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCcw, Plus, MoreVertical, Trash, GripHorizontal, Calendar, Mail, User } from 'lucide-vue-next'

import LeadPreview from '@/components/LeadPreview.vue'
import { Skeleton } from '@/components/ui/skeleton'

const loading = ref(true)
const leads = ref([])
// Default Pipeline Stages
const defaultStages = [

]

const availableColors = [
  { name: 'Azul', class: 'bg-blue-500/10 border-blue-200 text-blue-700', thumb: 'bg-blue-500' },
  { name: 'Amarelo', class: 'bg-yellow-500/10 border-yellow-200 text-yellow-700', thumb: 'bg-yellow-500' },
  { name: 'Roxo', class: 'bg-purple-500/10 border-purple-200 text-purple-700', thumb: 'bg-purple-500' },
  { name: 'Indigo', class: 'bg-indigo-500/10 border-indigo-200 text-indigo-700', thumb: 'bg-indigo-500' },
  { name: 'Verde', class: 'bg-green-500/10 border-green-200 text-green-700', thumb: 'bg-green-500' },
  { name: 'Vermelho', class: 'bg-red-500/10 border-red-200 text-red-700', thumb: 'bg-red-500' },
  { name: 'Rosa', class: 'bg-pink-500/10 border-pink-200 text-pink-700', thumb: 'bg-pink-500' },
  { name: 'Cinza', class: 'bg-gray-500/10 border-gray-200 text-gray-700', thumb: 'bg-gray-500' },
]

// Pipeline State
const pipeline = ref([...defaultStages])
const editingStage = ref(null)
const newStageName = ref('')
const previewLead = ref(null)
const showPreview = ref(false)

function openPreview(lead) {
  previewLead.value = lead
  showPreview.value = true
}

async function fetchPipeline() {
  const { data, error } = await supabase
    .from('crm_settings')
    .select('value')
    .eq('key', 'pipeline_stages')
    .single()

  if (data && data.value) {
    pipeline.value = data.value
  } else {
    // Initialize default if not exists
    pipeline.value = [...defaultStages]
    savePipeline()
  }
}

async function savePipeline() {
  const { error } = await supabase
    .from('crm_settings')
    .upsert({
      key: 'pipeline_stages',
      value: pipeline.value
    }, { onConflict: 'key' })

  if (error) console.error('Error saving pipeline:', error)
}

// Computed: Group Leads by Stage with Orphan Handling
const boardData = computed(() => {
  if (pipeline.value.length === 0) return []

  // Create a map of normalized stage titles for easy lookup & exact matching
  const stageTitles = new Set(pipeline.value.map(s => s.title))

  return pipeline.value.map((stage, index) => {
    let items = groupedLeads.value.filter(l => (l.status || 'Novo') === stage.title)

    // IF this is the FIRST stage, also append any leads whose status matches NO existing stage
    // This acts as a "Catch-all" for orphans or 'Novo' leads if 'Novo' column was deleted
    if (index === 0) {
      const orphans = groupedLeads.value.filter(l => {
        const status = l.status || 'Novo'
        return !stageTitles.has(status) // Status is not in ANY known stage
      })
      items = [...items, ...orphans]
    }

    return {
      ...stage,
      items
    }
  })
})

async function fetchLeads() {
  loading.value = true
  const { data, error } = await supabase
    .from('leads')
    .select(`
      id,
      created_at,
      data,
      metadata,
      status,
      forms ( title )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar leads:', error)
  } else {
    leads.value = data.map(l => ({
      ...l,
      metadata: typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata
    }))
  }
  loading.value = false
}


// Group leads by Email (Deduplication Logic)
const groupedLeads = computed(() => {
  const groups = {}

  if (!leads.value) return []

  leads.value.forEach(lead => {
    const email = getLeadEmail(lead) || `unknown-${lead.id}`
    if (!groups[email]) {
      groups[email] = {
        ...lead,
        history: [], // Store all forms here
        count: 0
      }
    }
    // Add to history
    groups[email].history.push(lead)
    groups[email].count++

    // If the "main" lead has no name but this one does, update name
    if (getLeadName(groups[email]).startsWith('Lead #') && !getLeadName(lead).startsWith('Lead #')) {
      // rough heuristic to pick "better" data
      groups[email].data = { ...groups[email].data, ...lead.data }
    }
  })

  return Object.values(groups)
})

// Handle Drag & Drop Change
async function onDragChange(event, stageTitle) {
  if (event.added) {
    const leadId = event.added.element.id
    const newStatus = stageTitle

    // Optimistic Update local state reference
    const leadIndex = leads.value.findIndex(l => l.id === leadId)
    if (leadIndex !== -1) {
      leads.value[leadIndex].status = newStatus
    }

    // Persist
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId)

    if (error) {
      console.error('Failed to update status:', error)
      // Revert if needed (omitted for brevity)
    }
  }
}

// Stage Management
function addStage() {
  pipeline.value.push({
    id: crypto.randomUUID(),
    title: 'Nova Etapa',
    color: 'bg-gray-100 border-gray-200 text-gray-700'
  })
  savePipeline()
}

function removeStage(stageIndex) {
  if (confirm('Tem certeza? Leads nesta etapa serão movidos para a primeira coluna disponível.')) {
    pipeline.value.splice(stageIndex, 1)

    // Safety: If pipeline becomes empty, restore "Novo"
    if (pipeline.value.length === 0) {
      pipeline.value.push({
        id: crypto.randomUUID(),
        title: 'Novo',
        color: 'bg-blue-500/10 border-blue-200 text-blue-700'
      })
    }

    savePipeline()
  }
}

function startEditStage(stage) {
  editingStage.value = stage.id
  newStageName.value = stage.title
}

function saveStageEdit(stage) {
  if (!newStageName.value.trim()) return
  stage.title = newStageName.value
  editingStage.value = null
  savePipeline()
}

function updateStageColor(stage, colorClass) {
  stage.color = colorClass
  savePipeline()
}

// Helper to get thumb color based on the full color class string
function getStageThumb(colorClass) {
  const match = availableColors.find(c => c.class === colorClass)
  // Fallback if not found (e.g. legacy data): try to heuristic parse
  if (!match) {
    try {
      return colorClass.split(' ')[2].replace('text-', 'bg-')
    } catch (e) {
      return 'bg-gray-500' // Fail safe
    }
  }
  return match.thumb
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Helpers to extract info from "data" JSON
function getLeadName(lead) {
  // Try common keys
  const keys = Object.keys(lead.data)
  const nameKey = keys.find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'))
  return nameKey ? lead.data[nameKey] : 'Lead #' + lead.id.slice(0, 4)
}

function getLeadEmail(lead) {
  const keys = Object.keys(lead.data)
  const emailKey = keys.find(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('mail'))
  return emailKey ? lead.data[emailKey] : null
}

onMounted(() => {
  fetchPipeline()
  fetchLeads()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between shrink-0 px-1">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
        <p class="text-muted-foreground">Arraste os cards para atualizar o status dos leads.</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button variant="outline" size="sm" @click="addStage">
          <Plus class="mr-2 h-4 w-4" /> Nova Etapa
        </Button>
        <Button variant="ghost" size="icon" @click="fetchLeads">
          <RefreshCcw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <!-- Kanban Board Area -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden pb-4">
      <div class="flex h-full gap-4 min-w-max px-1">

        <!-- COLUMNS -->
        <div v-for="(stage, index) in pipeline" :key="stage.id"
          class="flex flex-col w-[300px] shrink-0 h-full rounded-xl border shadow-sm transition-colors duration-300"
          :class="stage.color">
          <!-- Stage Header -->
          <div class="flex items-center justify-between p-3 border-b bg-muted/40 rounded-t-xl shrink-0">
            <div class="flex items-center gap-2 flex-1 min-w-0" v-if="editingStage !== stage.id">
              <div class="w-3 h-3 rounded-full" :class="getStageThumb(stage.color)"></div>
              <h3 class="font-semibold text-sm truncate" :title="stage.title">{{ stage.title }}</h3>
              <span class="text-xs text-muted-foreground px-1.5 py-0.5 bg-background rounded-full border">
                {{ boardData[index].items.length }}
              </span>
            </div>

            <!-- Inline Editor -->
            <div v-else class="flex items-center gap-1 flex-1">
              <Input v-model="newStageName" class="h-7 text-xs" @keyup.enter="saveStageEdit(stage)" autoFocus />
              <Button size="xs" variant="ghost" @click="saveStageEdit(stage)">OK</Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" class="h-6 w-6 ml-1 text-muted-foreground">
                  <MoreVertical class="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="startEditStage(stage)">Renomear</DropdownMenuItem>

                <!-- Color Picker Submenu -->
                <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Cor da Coluna</div>
                <div class="grid grid-cols-4 gap-1 p-2">
                  <button v-for="color in availableColors" :key="color.name"
                    class="w-6 h-6 rounded-full border transition-all hover:scale-110 focus:outline-none focus:ring-2 ring-ring"
                    :class="[color.thumb, stage.color === color.class ? 'ring-2 ring-offset-1' : '']"
                    :title="color.name" @click="updateStageColor(stage, color.class)"></button>
                </div>

                <DropdownMenuItem @click="removeStage(index)" class="text-destructive focus:text-destructive">Excluir
                  Coluna</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Draggable Area -->
          <div class="flex-1 overflow-y-auto p-2">

            <!-- Loading Skeletons -->
            <div v-if="loading" class="space-y-3">
              <div v-for="i in 3" :key="i" class="p-3 rounded-lg border shadow-sm bg-background space-y-2">
                <div class="flex justify-between items-start">
                  <Skeleton class="h-4 w-24" />
                  <Skeleton class="h-3 w-8" />
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <Skeleton class="h-3 w-3 rounded-full" />
                    <Skeleton class="h-3 w-32" />
                  </div>
                  <div class="flex items-center gap-2">
                    <Skeleton class="h-3 w-3 rounded-full" />
                    <Skeleton class="h-3 w-20" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Actual List -->
            <draggable v-else :list="boardData[index].items" item-key="id" group="leads"
              class="flex flex-col gap-2 min-h-[150px]" ghost-class="opacity-50" drag-class="cursor-grabbing"
              @change="(e) => onDragChange(e, stage.title)">
              <template #item="{ element: lead }">
                <div
                  class="cursor-grab active:cursor-grabbing bg-background p-3 rounded-lg border shadow-sm hover:shadow-md transition-all group"
                  @click="openPreview(lead)">
                  <!-- Card Content -->
                  <div class="flex justify-between items-start mb-2">
                    <div class="font-medium text-sm text-foreground line-clamp-1" :title="getLeadName(lead)">
                      {{ getLeadName(lead) }}
                    </div>
                    <span class="text-[10px] text-muted-foreground shrink-0">{{ formatDate(lead.created_at).split('')[0]
                    }}</span>
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex items-center gap-1.5 text-xs text-muted-foreground" v-if="getLeadEmail(lead)">
                      <Mail class="w-3 h-3" />
                      <span class="truncate">{{ getLeadEmail(lead) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div class="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                      <span class="truncate opacity-80" :title="lead.forms?.title">
                        {{ lead.forms?.title || 'Formulário Desconhecido' }}
                      </span>
                    </div>
                  </div>

                  <!-- Footer / Meta -->
                  <div
                    class="mt-3 pt-2 border-t flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <div class="text-[10px] text-muted-foreground flex gap-2">
                      <span v-if="lead.metadata?.city">{{ lead.metadata.city }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>

        <!-- Add Column Button (New) -->
        <div class="h-full pt-2">
          <Button variant="secondary" class="h-[50px] w-[300px] border-2 border-dashed bg-muted/20 hover:bg-muted/50"
            @click="addStage">
            <Plus class="mr-2 h-4 w-4" /> Adicionar Etapa
          </Button>
        </div>

      </div>
    </div>

    <LeadPreview :lead="previewLead" v-model:open="showPreview" />
  </div>
</template>
