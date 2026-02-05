<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, Trash, ExternalLink, Settings, Palette, Layout, Eye, Save } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const formId = route.params.id

// --- State ---
const activeTab = ref('editor') // 'editor', 'design', 'settings'
const saving = ref(false)
const publishedUrl = ref('')

// Form Data
const formTitle = ref('Novo Formulário')
const formDescription = ref('')
const formFields = ref([])

// Style Config
const styleConfig = ref({
  fontFamily: 'Inter',
  primaryColor: 'hsl(222.2 47.4% 11.2%)', // Default primary
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  borderRadius: '0.5', // rem
  btnRadius: '0.5', // rem
})

// Settings Config
const settingsConfig = ref({
  isMultiStep: false,
  successMessage: 'Obrigado! Suas informações foram enviadas com sucesso.',
  redirectUrl: ''
})

const fieldTypes = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'email', label: 'E-mail' },
  { value: 'number', label: 'Número' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Seleção (Dropdown)' },
  { value: 'step_break', label: '--- Quebra de Etapa ---' }
]

const fontOptions = [
  { value: 'Inter', label: 'Inter (Padrão)', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { value: 'Roboto', label: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
  { value: 'Open Sans', label: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap' },
  { value: 'Lato', label: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { value: 'Montserrat', label: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap' },
  { value: 'Lobster', label: 'Lobster (Cursiva)', url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap' },
]

// --- Computed ---
const embedCode = computed(() => {
  if (!publishedUrl.value) return ''
  try {
    const urlObj = new URL(publishedUrl.value)
    const origin = urlObj.origin
    const id = urlObj.pathname.split('/').pop()
    // New Smart Embed Script is not strictly needed for style inheritance anymore if we use the internal style config,
    // BUT we still use it for resizing and basic integration.
    // We can just use a simple script that points to the form.
    return `<script src="${origin}/embed.js" data-form-id="${id}" async><\/script>`
  } catch (e) {
    return ''
  }
})

const previewStyle = computed(() => {
  return {
    '--primary': styleConfig.value.primaryColor, // We might need to handle HSL vs Hex here if using Shadcn variables strictly
    '--radius': `${styleConfig.value.borderRadius}rem`,
    'font-family': styleConfig.value.fontFamily,
    'background-color': styleConfig.value.backgroundColor,
    'color': styleConfig.value.textColor,
  }
})

// --- Actions ---

function addField() {
  formFields.value.push({
    id: crypto.randomUUID(),
    type: 'text',
    label: 'Novo Campo',
    placeholder: '',
    required: false,
    options: []
  })
}

function removeField(index) {
  formFields.value.splice(index, 1)
}

function addOption(field) {
  if (!field.options) field.options = []
  field.options.push({ label: 'Opção ' + (field.options.length + 1), value: 'opcao_' + (field.options.length + 1) })
}

function removeOption(field, idx) {
  field.options.splice(idx, 1)
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  alert('Copiado para a área de transferência!')
}

async function saveForm() {
  saving.value = true

  const payload = {
    title: formTitle.value,
    description: formDescription.value,
    schema: formFields.value,
    style: styleConfig.value,
    settings: settingsConfig.value
  }

  let result;
  if (formId) {
    result = await supabase.from('forms').update(payload).eq('id', formId).select().single()
  } else {
    result = await supabase.from('forms').insert(payload).select().single()
  }

  const { data, error } = result
  saving.value = false

  if (error) {
    console.error(error)
    alert('Erro ao salvar: ' + error.message)
  } else {
    publishedUrl.value = `${window.location.origin}/form/${data.id}`
    if (!formId) router.push(`/builder/${data.id}`)
  }
}

// Watch font change to inject link in head (for preview)
watch(() => styleConfig.value.fontFamily, (newFont) => {
  const fontObj = fontOptions.find(f => f.value === newFont)
  if (fontObj) {
    if (!document.querySelector(`link[href="${fontObj.url}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontObj.url
      document.head.appendChild(link)
    }
  }
})

onMounted(async () => {
  if (formId) {
    const { data, error } = await supabase.from('forms').select('*').eq('id', formId).single()
    if (data) {
      formTitle.value = data.title
      formDescription.value = data.description
      formFields.value = data.schema || []

      if (data.style) styleConfig.value = { ...styleConfig.value, ...data.style }
      if (data.settings) settingsConfig.value = { ...settingsConfig.value, ...data.settings }

      // Initialize options
      formFields.value.forEach(f => {
        if (f.type === 'select' && !f.options) f.options = []
      })
      publishedUrl.value = `${window.location.origin}/form/${data.id}`
    }
  }
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-muted/20">

    <!-- Left Sidebar: Configuration -->
    <div class="w-full md:w-[400px] border-r bg-background flex flex-col h-full overflow-hidden">
      <!-- Tabs Header -->
      <div class="flex border-b">
        <button @click="activeTab = 'editor'"
          :class="['flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors', activeTab === 'editor' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/50']">
          <Layout class="h-4 w-4" /> Editor
        </button>
        <button @click="activeTab = 'design'"
          :class="['flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors', activeTab === 'design' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/50']">
          <Palette class="h-4 w-4" /> Design
        </button>
        <button @click="activeTab = 'settings'"
          :class="['flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors', activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/50']">
          <Settings class="h-4 w-4" /> Ajustes
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">

        <!-- EDITOR TAB -->
        <div v-show="activeTab === 'editor'" class="space-y-6">
          <div class="space-y-4">
            <div class="grid gap-2">
              <Label>Nome do Formulário</Label>
              <Input v-model="formTitle" />
            </div>
            <div class="grid gap-2">
              <Label>Descrição</Label>
              <Input v-model="formDescription" />
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase text-muted-foreground">Campos do Formulário</h3>
              <Button @click="addField" size="sm" variant="outline" class="h-8 gap-1">
                <Plus class="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <div class="space-y-3">
              <Card v-for="(field, index) in formFields" :key="field.id" class="relative group border-l-4"
                :class="field.type === 'step_break' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-l-transparent'">
                <CardContent class="p-3 space-y-3">

                  <div class="flex items-start justify-between gap-2">
                    <div class="grid gap-1 w-full">
                      <label class="text-[10px] font-medium text-muted-foreground uppercase">Tipo</label>
                      <Select v-model="field.type">
                        <SelectTrigger class="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="t in fieldTypes" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button @click="removeField(index)" variant="ghost" size="icon"
                      class="h-7 w-7 text-destructive shrink-0">
                      <Trash class="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div v-if="field.type !== 'step_break'" class="space-y-3">
                    <div class="grid gap-1">
                      <Label class="text-xs">Rótulo</Label>
                      <Input v-model="field.label" class="h-8 text-sm" />
                    </div>
                    <div v-if="field.type !== 'select'" class="grid gap-1">
                      <Label class="text-xs">Placeholder</Label>
                      <Input v-model="field.placeholder" class="h-8 text-sm" />
                    </div>

                    <!-- Options for Select -->
                    <div v-if="field.type === 'select'" class="bg-muted/30 p-2 rounded-md space-y-2">
                      <div class="flex justify-between items-center">
                        <Label class="text-[10px] uppercase">Opções</Label>
                        <Button @click="addOption(field)" size="xs" variant="ghost" class="h-5 text-xs px-1">
                          <Plus class="w-3 h-3" /> Add
                        </Button>
                      </div>
                      <div v-for="(opt, idx) in field.options" :key="idx" class="flex gap-1">
                        <Input v-model="opt.label" class="h-6 text-xs flex-1" placeholder="Label" />
                        <Input v-model="opt.value" class="h-6 text-xs w-20" placeholder="Value" />
                        <Button @click="removeOption(field, idx)" variant="ghost" size="icon"
                          class="h-6 w-6 text-destructive">
                          <Trash class="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                      <input type="checkbox" :id="`req-${field.id}`" v-model="field.required"
                        class="rounded border-gray-300 transform scale-75" />
                      <label :for="`req-${field.id}`" class="text-xs cursor-pointer select-none">Obrigatório</label>
                    </div>
                  </div>
                  <div v-else>
                    <p class="text-xs text-blue-600 dark:text-blue-400 font-medium text-center py-1">O formulário será
                      dividido aqui.</p>
                  </div>

                </CardContent>
              </Card>
              <div v-if="formFields.length === 0"
                class="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                Seu formulário está vazio.
              </div>
            </div>
          </div>
        </div>

        <!-- DESIGN TAB -->
        <div v-show="activeTab === 'design'" class="space-y-6">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label>Fonte</Label>
              <Select v-model="styleConfig.fontFamily">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="f in fontOptions" :key="f.value" :value="f.value">{{ f.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label>Cor Principal (Botões)</Label>
              <div class="flex gap-2">
                <Input type="color" v-model="styleConfig.primaryColor" class="w-12 h-9 p-0.5" />
                <Input v-model="styleConfig.primaryColor" class="font-mono flex-1" />
              </div>
            </div>

            <div class="grid gap-2">
              <Label>Cor do Fundo</Label>
              <div class="flex gap-2">
                <Input type="color" v-model="styleConfig.backgroundColor" class="w-12 h-9 p-0.5" />
                <Input v-model="styleConfig.backgroundColor" class="font-mono flex-1" />
              </div>
            </div>

            <div class="grid gap-2">
              <Label>Cor do Texto</Label>
              <div class="flex gap-2">
                <Input type="color" v-model="styleConfig.textColor" class="w-12 h-9 p-0.5" />
                <Input v-model="styleConfig.textColor" class="font-mono flex-1" />
              </div>
            </div>

            <div class="grid gap-2">
              <Label>Arredondamento (Containers)</Label>
              <div class="flex items-center gap-2">
                <input type="range" v-model="styleConfig.borderRadius" min="0" max="2" step="0.1" class="flex-1" />
                <span class="text-xs font-mono w-10 text-right">{{ styleConfig.borderRadius }}rem</span>
              </div>
            </div>

            <div class="grid gap-2">
              <Label>Arredondamento (Botões)</Label>
              <div class="flex items-center gap-2">
                <input type="range" v-model="styleConfig.btnRadius" min="0" max="3" step="1" class="flex-1" />
                <span class="text-xs font-mono w-10 text-right">{{ styleConfig.btnRadius }}px</span>
                <!-- Note: Handling unit properly, kept it simple here -->
              </div>
            </div>
          </div>
        </div>

        <!-- SETTINGS TAB -->
        <div v-show="activeTab === 'settings'" class="space-y-6">
          <div class="space-y-4">
            <div class="grid gap-2">
              <Label>Mensagem de Sucesso</Label>
              <Input v-model="settingsConfig.successMessage" />
              <p class="text-xs text-muted-foreground">Exibida após o envio.</p>
            </div>
            <div class="grid gap-2">
              <Label>URL de Redirecionamento (Opcional)</Label>
              <Input v-model="settingsConfig.redirectUrl" placeholder="https://" />
              <p class="text-xs text-muted-foreground">Se preenchido, o usuário será redirecionado para este link.</p>
            </div>
            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" id="multiStepCheck" v-model="settingsConfig.isMultiStep" class="h-4 w-4" />
              <Label for="multiStepCheck">Habilitar Modo Multi-etapas</Label>
            </div>
            <p class="text-xs text-muted-foreground ml-6">
              Se marcado, use o campo "Quebra de Etapa" no editor para separar as páginas.
            </p>
          </div>

          <!-- Publish Info -->
          <div v-if="publishedUrl" class="p-3 bg-muted rounded border mt-6">
            <Label class="text-xs mb-1 block">Link Público</Label>
            <div class="flex gap-2 mb-3">
              <Input readonly :value="publishedUrl" class="h-8 text-xs bg-background" />
              <Button @click="copyToClipboard(publishedUrl)" size="sm" variant="outline" class="h-8">
                <ExternalLink class="w-3 h-3" />
              </Button>
            </div>

            <Label class="text-xs mb-1 block">Código Embed</Label>
            <textarea :value="embedCode" readonly
              class="w-full h-20 text-xs font-mono p-2 rounded border bg-background text-muted-foreground resize-none"
              @click="$event.target.select()"></textarea>
          </div>
        </div>

      </div>

      <!-- Footer Actions -->
      <div class="p-4 border-t bg-background">
        <Button @click="saveForm" class="w-full" :disabled="saving">
          <Save class="w-4 h-4 mr-2" /> {{ saving ? 'Salvando...' : 'Salvar Formulário' }}
        </Button>
      </div>
    </div>

    <!-- Right: Live Preview -->
    <div class="flex-1 overflow-y-auto bg-muted/10 p-6 md:p-10 flex items-start justify-center">
      <div class="w-full max-w-xl transition-all duration-300" :style="previewStyle">
        <!-- The container itself doesn't have styled class, we use style attribute to simulate reset -->
        <div class="shadow-xl overflow-hidden border" :style="{
          backgroundColor: styleConfig.backgroundColor,
          color: styleConfig.textColor,
          borderRadius: styleConfig.borderRadius + 'rem',
          fontFamily: styleConfig.fontFamily
        }">
          <div class="p-8 space-y-6">
            <div>
              <h1 class="text-2xl font-bold mb-1">{{ formTitle }}</h1>
              <p class="opacity-80 text-sm" v-if="formDescription">{{ formDescription }}</p>
            </div>

            <div class="space-y-4">
              <!-- Simulating Form Rendering -->
              <div v-for="field in formFields.filter(f => f.type !== 'step_break')" :key="field.id" class="space-y-1.5">
                <label class="text-sm font-medium">{{ field.label }} <span v-if="field.required"
                    class="text-red-500">*</span></label>

                <div v-if="field.type === 'select'" class="h-10 w-full border rounded px-3 py-2 opacity-60">
                  Selecione...
                </div>
                <div v-else-if="field.type === 'textarea'" class="h-20 w-full border rounded px-3 py-2 opacity-60">
                </div>
                <div v-else class="h-10 w-full border rounded px-3 py-2 opacity-60"></div>
              </div>

              <!-- Pagination Preview if Multistep -->
              <div v-if="settingsConfig.isMultiStep && formFields.some(f => f.type === 'step_break')"
                class="flex justify-between pt-4">
                <button class="px-4 py-2 border rounded opacity-50 text-sm">Voltar</button>
                <button class="px-4 py-2 rounded text-white text-sm" :style="{
                  backgroundColor: styleConfig.primaryColor,
                  borderRadius: (styleConfig.btnRadius || 4) + 'px'
                }">Próximo</button>
              </div>
              <!-- Standard Submit -->
              <div v-else class="pt-4">
                <button class="w-full px-4 py-2 rounded text-white font-medium" :style="{
                  backgroundColor: styleConfig.primaryColor,
                  borderRadius: (styleConfig.btnRadius || 4) + 'px'
                }">Enviar</button>
              </div>

            </div>
          </div>
          <!-- Branding Footer -->
          <div class="py-2 text-center text-[10px] opacity-40 uppercase tracking-widest border-t">
            Powered by SimpleCRM
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
