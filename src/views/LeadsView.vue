<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCcw, MapPin, Monitor } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const leads = ref([])
const loading = ref(true)

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
      forms (
        title
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar leads:', error)
  } else {
    // Ensure metadata is object
    leads.value = data.map(l => ({
      ...l,
      metadata: typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata
    }))
  }
  loading.value = false
}

async function updateStatus(leadId, newStatus) {
  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId)

  if (error) {
    alert('Erro ao atualizar status')
    console.error(error)
  } else {
    // Optimistic update
    const lead = leads.value.find(l => l.id === leadId)
    if (lead) lead.status = newStatus
  }
}

const statusOptions = [
  { value: 'Novo', label: 'Novo', color: 'bg-blue-500' },
  { value: 'Em Andamento', label: 'Em Andamento', color: 'bg-yellow-500' },
  { value: 'Qualificado', label: 'Qualificado', color: 'bg-purple-500' },
  { value: 'Ganho', label: 'Ganho', color: 'bg-green-500' },
  { value: 'Perdido', label: 'Perdido', color: 'bg-red-500' }
]

onMounted(() => {
  fetchLeads()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Funil de Vendas</h1>
        <p class="text-muted-foreground">
          Gerencie o status e visualize detalhes dos seus leads.
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Button variant="outline" @click="fetchLeads">
          <RefreshCcw class="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </div>

    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[150px]">Status</TableHead>
            <TableHead>Lead (Dados)</TableHead>
            <TableHead>Contexto</TableHead>
            <TableHead class="text-right">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colSpan="4" class="text-center h-24">
              Carregando...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="leads.length === 0">
            <TableCell colSpan="4" class="text-center h-24 text-muted-foreground">
              Nenhum lead encontrado.
            </TableCell>
          </TableRow>
          <TableRow v-else v-for="lead in leads" :key="lead.id">
            <TableCell>
              <Select :model-value="lead.status || 'Novo'" @update:model-value="(val) => updateStatus(lead.id, val)">
                <SelectTrigger class="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full" :class="opt.color" />
                      <span>{{ opt.label }}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div class="flex flex-col gap-1">
                <div class="font-medium text-sm">{{ lead.forms?.title }}</div>
                <div class="text-sm space-y-1">
                  <div v-for="(val, key) in lead.data" :key="key" class="flex gap-1">
                    <span class="text-muted-foreground font-medium text-xs uppercase">{{ key }}:</span>
                    <span class="text-foreground">{{ val }}</span>
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex flex-col gap-1 text-xs text-muted-foreground"
                v-if="lead.metadata && Object.keys(lead.metadata).length">
                <div v-if="lead.metadata.city" class="flex items-center gap-1">
                  <MapPin class="h-3 w-3" />
                  {{ lead.metadata.city }}, {{ lead.metadata.region }}
                </div>
                <div v-if="lead.metadata.ip" class="font-mono text-[10px]">
                  IP: {{ lead.metadata.ip }}
                </div>
                <div v-if="lead.metadata.userAgent" class="flex items-center gap-1" title="User Agent">
                  <Monitor class="h-3 w-3" />
                  <span class="truncate max-w-[150px]">{{ lead.metadata.userAgent }}</span>
                </div>
              </div>
              <div v-else class="text-xs text-muted-foreground italic">
                Sem metadados
              </div>
            </TableCell>
            <TableCell class="text-right text-xs text-muted-foreground">
              {{ new Date(lead.created_at).toLocaleString('pt-BR') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
