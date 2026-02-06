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
import { Plus, Trash, ExternalLink, Settings, Palette, Layout, Eye, Save, GripVertical } from 'lucide-vue-next'
import draggable from 'vuedraggable'

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
  inputRadius: '0.5', // rem
  buttonAlign: 'block', // 'left', 'center', 'right', 'block'
  inputStyle: 'solid', // 'solid', 'outline', 'underline'
  shadowStrength: 'lg', // 'none', 'sm', 'md', 'lg', 'xl'
  // New props
  borderWidth: '0', // px
  borderColor: '#e2e8f0',
  cardPadding: '2', // rem
  titleColor: '#0f172a',
  labelColor: '#0f172a',
  titleSize: 'xl', // 'sm', 'md', 'lg', 'xl', '2xl'
})

// Settings Config
const settingsConfig = ref({
  isMultiStep: false,
  successMessage: 'Obrigado! Suas informações foram enviadas com sucesso.',
  redirectUrl: '',
  // New props
  showTitle: true,
  submitText: 'Enviar',
  nextText: 'Próximo',
  backText: 'Voltar'
})

const fieldTypes = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'email', label: 'E-mail' },
  { value: 'number', label: 'Número' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'select', label: 'Seleção' },
  { value: 'radio', label: 'Múltipla Escolha' },
  { value: 'checkbox', label: 'Caixa de Seleção' },
  { value: 'step_break', label: 'Quebra de Etapa' }
]

const fontOptions = [
  { value: 'Inter', label: 'Inter (Padrão)', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { value: 'Roboto', label: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
  { value: 'Open Sans', label: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap' },
  { value: 'Lato', label: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { value: 'Montserrat', label: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap' },
  { value: 'Poppins', label: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap' },
  { value: 'Oswald', label: 'Oswald (Compacta)', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap' },
  { value: 'Merriweather', label: 'Merriweather (Serifa)', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegante)', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap' },
  { value: 'Inconsolata', label: 'Inconsolata (Mono)', url: 'https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap' },
  { value: 'Dancing Script', label: 'Dancing Script (Cursiva)', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap' },
  { value: 'Lobster', label: 'Lobster (Cursiva Bold)', url: 'https://fonts.googleapis.com/css2?family=Lobster&display=swap' },
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
  const shadows = {
    'none': 'none',
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  }
  return {
    '--primary': styleConfig.value.primaryColor,
    '--radius': `${styleConfig.value.borderRadius}rem`,
    'font-family': styleConfig.value.fontFamily,
    'background-color': styleConfig.value.backgroundColor,
    'color': styleConfig.value.textColor,
    '--input-radius': `${styleConfig.value.inputRadius || 0.5}rem`,
    '--input-style': styleConfig.value.inputStyle,
    '--shadow': shadows[styleConfig.value.shadowStrength || 'lg']
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

// Watch for step_break to auto-enable/disable multi-step
watch(() => formFields.value, (fields) => {
  const hasBreak = fields.some(f => f.type === 'step_break')
  if (hasBreak && !settingsConfig.value.isMultiStep) {
    settingsConfig.value.isMultiStep = true
  } else if (!hasBreak && settingsConfig.value.isMultiStep) {
    settingsConfig.value.isMultiStep = false
  }
}, { deep: true })

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
        if (['select', 'radio', 'checkbox'].includes(f.type) && !f.options) f.options = []
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
      <div class="px-4 pt-4 pb-2">
        <div class="flex items-center p-1 bg-muted rounded-lg border">
          <button @click="activeTab = 'editor'"
            :class="['flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all', activeTab === 'editor' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
            <Layout class="h-3.5 w-3.5" /> Editor
          </button>
          <button @click="activeTab = 'design'"
            :class="['flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all', activeTab === 'design' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
            <Palette class="h-3.5 w-3.5" /> Design
          </button>
          <button @click="activeTab = 'settings'"
            :class="['flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all', activeTab === 'settings' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
            <Settings class="h-3.5 w-3.5" /> Ajustes
          </button>
        </div>
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
              <draggable v-model="formFields" item-key="id" handle=".drag-handle" ghost-class="opacity-50"
                class="space-y-3">
                <template #item="{ element: field, index }">
                  <div class="group bg-card border rounded-lg shadow-sm transition-all hover:shadow-md"
                    :class="field.type === 'step_break' ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'hover:border-primary/50'">

                    <!-- Card Header -->
                    <div class="flex items-center gap-3 p-3 border-b bg-muted/20 rounded-t-lg">
                      <div
                        class="cursor-grab drag-handle text-muted-foreground hover:text-foreground py-1 px-0.5 rounded hover:bg-muted transition-colors">
                        <GripVertical class="w-4 h-4" />
                      </div>

                      <div class="flex-1 font-medium text-sm flex items-center gap-2">
                        <span v-if="field.label" class="truncate max-w-[150px]">{{ field.label }}</span>
                        <span v-else class="text-muted-foreground italic">Sem rótulo</span>
                        <span
                          class="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase opacity-70">{{
                            fieldTypes.find(t => t.value === field.type)?.label || field.type}}</span>
                      </div>

                      <Button @click="removeField(index)" variant="ghost" size="icon"
                        class="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash class="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <!-- Card Body -->
                    <div class="p-4 space-y-4">
                      <!-- Field Type Selector (Hidden by default or smaller?) -> Keeping it accessible but simpler -->
                      <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-1.5">
                          <Label class="text-xs text-muted-foreground">Tipo do Campo</Label>
                          <Select v-model="field.type">
                            <SelectTrigger class="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem v-for="t in fieldTypes" :key="t.value" :value="t.value">{{ t.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div class="grid gap-1.5" v-if="field.type !== 'step_break'">
                          <Label class="text-xs text-muted-foreground">Obrigatório?</Label>
                          <div class="flex items-center h-8">
                            <div class="flex items-center gap-2 cursor-pointer"
                              @click="field.required = !field.required">
                              <div class="w-9 h-5 rounded-full relative transition-colors duration-200"
                                :class="field.required ? 'bg-primary' : 'bg-input'">
                                <div
                                  class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                                  :class="field.required ? 'translate-x-4' : 'translate-x-0'"></div>
                              </div>
                              <span class="text-xs">{{ field.required ? 'Sim' : 'Não' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Field Details -->
                      <div v-if="field.type !== 'step_break'" class="space-y-3 pt-2 border-t">
                        <div class="grid gap-3">
                          <div class="grid gap-1.5">
                            <Label class="text-xs font-semibold">Rótulo (Pergunta)</Label>
                            <Input v-model="field.label" class="h-8 text-sm" placeholder="Ex: Qual seu nome?" />
                          </div>
                          <div class="grid gap-1.5"
                            v-if="field.type !== 'select' && field.type !== 'radio' && field.type !== 'checkbox'">
                            <Label class="text-xs font-semibold">Texto de Ajuda (Placeholder)</Label>
                            <Input v-model="field.placeholder" class="h-8 text-sm" placeholder="Ex: Digite aqui..." />
                          </div>
                        </div>

                        <!-- Options Editor -->
                        <div v-if="['select', 'radio', 'checkbox'].includes(field.type)"
                          class="bg-muted/30 rounded-lg p-3 border space-y-3">
                          <div
                            class="flex justify-between items-center text-xs font-medium uppercase text-muted-foreground">
                            <span>Opções</span>
                            <Button @click="addOption(field)" size="xs" variant="outline"
                              class="h-6 text-[10px] gap-1 bg-background hover:bg-accent px-2">
                              <Plus class="w-3 h-3" /> Adicionar
                            </Button>
                          </div>

                          <div class="space-y-2">
                            <div v-if="field.options.length === 0"
                              class="text-center py-2 text-xs text-muted-foreground italic">
                              Nenhuma opção adicionada.
                            </div>
                            <div v-for="(opt, idx) in field.options" :key="idx" class="flex gap-2 items-center">
                              <div class="grid gap-0.5 flex-1">
                                <Input v-model="opt.label" class="h-7 text-xs bg-background"
                                  placeholder="Texto visível" />
                              </div>
                              <div class="grid gap-0.5 w-24">
                                <Input v-model="opt.value" class="h-7 text-xs bg-background font-mono opacity-80"
                                  placeholder="Valor interno" />
                              </div>
                              <Button @click="removeOption(field, idx)" variant="ghost" size="icon"
                                class="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                                <Trash class="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-else class="py-4 text-center">
                        <div
                          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          <Layout class="w-3.5 h-3.5" />
                          Separador de Página
                        </div>
                        <p class="text-[10px] text-muted-foreground mt-2 max-w-[200px] mx-auto">O formulário será
                          paginado aqui. Um botão "Próximo" será inserido automaticamente.</p>
                      </div>
                    </div>

                  </div>
                </template>
              </draggable>

              <div v-if="formFields.length === 0"
                class="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                @click="addField">
                <div class="bg-muted p-3 rounded-full mb-3">
                  <Plus class="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 class="font-semibold text-foreground">Seu formulário está vazio</h3>
                <p class="text-sm text-muted-foreground mt-1 mb-4">Adicione campos para começar a construir.</p>
                <Button size="sm" variant="outline">Adicionar Campo</Button>
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
                <input type="range" v-model="styleConfig.btnRadius" min="0" max="40" step="1" class="flex-1" />
                <span class="text-xs font-mono w-10 text-right">{{ styleConfig.btnRadius }}px</span>
                <!-- Note: Handling unit properly, kept it simple here -->
              </div>
            </div>

            <div class="grid gap-2">
              <Label>Arredondamento (Campos)</Label>
              <div class="flex items-center gap-2">
                <input type="range" v-model="styleConfig.inputRadius" min="0" max="2" step="0.1" class="flex-1" />
                <span class="text-xs font-mono w-10 text-right">{{ styleConfig.inputRadius }}rem</span>
              </div>
            </div>

            <div class="grid gap-2">
              <Label>Sombra do Card</Label>
              <Select v-model="styleConfig.shadowStrength">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="sm">Suave</SelectItem>
                  <SelectItem value="md">Média</SelectItem>
                  <SelectItem value="lg">Intensa (Padrão)</SelectItem>
                  <SelectItem value="xl">Muito Intensa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label>Estilo dos Campos</Label>
              <Select v-model="styleConfig.inputStyle">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólido (Fundo Branco)</SelectItem>
                  <SelectItem value="outline">Borda (Fundo Transp.)</SelectItem>
                  <SelectItem value="underline">Apenas Linha (Underline)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label>Alinhamento do Botão</Label>
              <div class="flex bg-muted/50 rounded-md p-1">
                <button @click="styleConfig.buttonAlign = 'left'"
                  :class="['flex-1 py-1 text-xs rounded transition-colors', styleConfig.buttonAlign === 'left' ? 'bg-background shadow text-primary' : 'hover:bg-background/50']">Esq</button>
                <button @click="styleConfig.buttonAlign = 'center'"
                  :class="['flex-1 py-1 text-xs rounded transition-colors', styleConfig.buttonAlign === 'center' ? 'bg-background shadow text-primary' : 'hover:bg-background/50']">Centro</button>
                <button @click="styleConfig.buttonAlign = 'right'"
                  :class="['flex-1 py-1 text-xs rounded transition-colors', styleConfig.buttonAlign === 'right' ? 'bg-background shadow text-primary' : 'hover:bg-background/50']">Dir</button>
                <button @click="styleConfig.buttonAlign = 'block'"
                  :class="['flex-1 py-1 text-xs rounded transition-colors', styleConfig.buttonAlign === 'block' ? 'bg-background shadow text-primary' : 'hover:bg-background/50']">Total</button>
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
              <input type="checkbox" id="showTitleCheck" v-model="settingsConfig.showTitle" class="h-4 w-4" />
              <Label for="showTitleCheck">Exibir Título e Descrição</Label>
            </div>

            <div class="grid gap-3 pt-2 border-t">
              <Label>Textos dos Botões</Label>
              <div class="grid grid-cols-2 gap-3">
                <div class="grid gap-1">
                  <Label class="text-xs">Botão Enviar</Label>
                  <Input v-model="settingsConfig.submitText" placeholder="Enviar" class="h-8" />
                </div>
                <div class="grid gap-1" v-if="settingsConfig.isMultiStep">
                  <Label class="text-xs">Próximo</Label>
                  <Input v-model="settingsConfig.nextText" placeholder="Próximo" class="h-8" />
                </div>
                <div class="grid gap-1" v-if="settingsConfig.isMultiStep">
                  <Label class="text-xs">Voltar</Label>
                  <Input v-model="settingsConfig.backText" placeholder="Voltar" class="h-8" />
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t mt-2">
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
        <div class="overflow-hidden" :style="{
          backgroundColor: styleConfig.backgroundColor,
          color: styleConfig.textColor,
          borderRadius: styleConfig.borderRadius + 'rem',
          fontFamily: styleConfig.fontFamily,
          boxShadow: previewStyle['--shadow'],
          borderWidth: styleConfig.borderWidth + 'px',
          borderColor: styleConfig.borderColor
        }">
          <div class="space-y-6" :style="{ padding: styleConfig.cardPadding + 'rem' }">
            <div v-if="settingsConfig.showTitle">
              <h1 class="font-bold mb-1" :style="{ color: styleConfig.titleColor }" :class="{
                'text-sm': styleConfig.titleSize === 'sm',
                'text-base': styleConfig.titleSize === 'md',
                'text-lg': styleConfig.titleSize === 'lg',
                'text-xl': styleConfig.titleSize === 'xl',
                'text-2xl': styleConfig.titleSize === '2xl',
              }">{{ formTitle }}</h1>
              <p class="opacity-80 text-sm" v-if="formDescription">{{ formDescription }}</p>
            </div>

            <div class="space-y-4">
              <!-- Simulating Form Rendering -->
              <div v-for="field in formFields" :key="field.id" class="space-y-1.5">
                <!-- Check for Step Break -->
                <div v-if="field.type === 'step_break'"
                  class="py-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <div class="h-px bg-border flex-1"></div>
                  <span class="uppercase tracking-widest font-medium opacity-50">Fim da Página</span>
                  <div class="h-px bg-border flex-1"></div>
                </div>

                <div v-else>
                  <label class="text-sm font-medium" :style="{ color: styleConfig.labelColor }">{{ field.label }} <span
                      v-if="field.required" class="text-red-500">*</span></label>


                  <div v-if="field.type === 'select'"
                    class="h-10 w-full border rounded px-3 py-2 opacity-60 flex items-center" :style="{
                      borderRadius: (styleConfig.inputRadius || 0.5) + 'rem',
                      backgroundColor: styleConfig.inputStyle === 'solid' ? '#fff' : 'transparent',
                      borderColor: styleConfig.inputStyle === 'underline' ? 'transparent' : 'inherit',
                      borderBottomColor: styleConfig.inputStyle === 'underline' ? 'inherit' : 'transparent',
                      borderBottomWidth: styleConfig.inputStyle === 'underline' ? '1px' : '1px'
                    }">
                    Selecione...
                  </div>

                  <div v-else-if="field.type === 'radio'" class="space-y-2 opacity-60">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded-full border border-current"></div>
                      <span class="text-sm">Opção 1</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded-full border border-current"></div>
                      <span class="text-sm">Opção 2</span>
                    </div>
                  </div>

                  <div v-else-if="field.type === 'checkbox'" class="space-y-2 opacity-60">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-current"></div>
                      <span class="text-sm">Opção 1</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-current"></div>
                      <span class="text-sm">Opção 2</span>
                    </div>
                  </div>

                  <div v-else-if="field.type === 'textarea'" class="h-20 w-full border rounded px-3 py-2 opacity-60"
                    :style="{
                      borderRadius: (styleConfig.inputRadius || 0.5) + 'rem',
                      backgroundColor: styleConfig.inputStyle === 'solid' ? '#fff' : 'transparent',
                      borderColor: styleConfig.inputStyle === 'underline' ? 'transparent' : 'inherit',
                      borderBottomColor: styleConfig.inputStyle === 'underline' ? 'inherit' : 'transparent',
                      borderBottomWidth: styleConfig.inputStyle === 'underline' ? '1px' : '1px'
                    }">
                  </div>
                  <div v-else class="h-10 w-full border rounded px-3 py-2 opacity-60" :style="{
                    borderRadius: (styleConfig.inputRadius || 0.5) + 'rem',
                    backgroundColor: styleConfig.inputStyle === 'solid' ? '#fff' : 'transparent',
                    borderColor: styleConfig.inputStyle === 'underline' ? 'transparent' : 'inherit',
                    borderBottomColor: styleConfig.inputStyle === 'underline' ? 'inherit' : 'transparent',
                    borderBottomWidth: styleConfig.inputStyle === 'underline' ? '1px' : '1px'
                  }"></div>
                </div>
              </div>

              <!-- Pagination Preview if Multistep -->
              <div v-if="settingsConfig.isMultiStep && formFields.some(f => f.type === 'step_break')"
                class="flex justify-between pt-4">
                <button class="px-4 py-2 border rounded opacity-50 text-sm">{{ settingsConfig.backText || 'Voltar'
                }}</button>
                <button class="px-4 py-2 rounded text-white text-sm" :style="{
                  backgroundColor: styleConfig.primaryColor,
                  borderRadius: (styleConfig.btnRadius || 4) + 'px'
                }">{{ settingsConfig.nextText || 'Próximo' }}</button>
              </div>
              <!-- Standard Submit -->
              <div v-else class="pt-4">
                <button class="w-full px-4 py-2 rounded text-white font-medium" :style="{
                  backgroundColor: styleConfig.primaryColor,
                  borderRadius: (styleConfig.btnRadius || 4) + 'px'
                }">{{ settingsConfig.submitText || 'Enviar' }}</button>
              </div>

            </div>
          </div>
          <!-- Branding Footer -->
        </div>
      </div>
    </div>

  </div>
</template>
