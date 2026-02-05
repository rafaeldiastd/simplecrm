<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const route = useRoute()
const formId = route.params.id

const loading = ref(true)
const form = ref(null)
const formData = ref({})
const submitted = ref(false)
const error = ref(null)
const metadata = ref({})

// Multi-step State
const currentStep = ref(0)
const steps = ref([]) // Array of Arrays of fields

// Computed Styles
const rootStyle = computed(() => {
  if (!form.value || !form.value.style) return {}
  const s = form.value.style
  return {
    '--primary-color': s.primaryColor,
    '--bg-color': s.backgroundColor,
    '--text-color': s.textColor,
    '--radius': `${s.borderRadius || 0.5}rem`,
    '--btn-radius': `${s.btnRadius || 4}px`,
    'font-family': s.fontFamily,
    'color': s.textColor
  }
})

onMounted(async () => {
  // 1. Fetch form definition
  const { data, error: fetchError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single()

  if (fetchError) {
    error.value = 'Formulário não encontrado ou excluído.'
    loading.value = false
    return
  }

  form.value = data

  // Initialize form data model & Steps
  if (data.schema) {
    let currentChunk = []

    data.schema.forEach(field => {
      if (field.type === 'step_break') {
        if (currentChunk.length > 0) steps.value.push(currentChunk)
        currentChunk = []
      } else {
        formData.value[field.label] = ''
        currentChunk.push(field)
      }
    })
    // Push last chunk
    if (currentChunk.length > 0) steps.value.push(currentChunk)

    // Fallback if no steps found (unlikely if schema exists)
    if (steps.value.length === 0 && data.schema.length > 0) {
      steps.value.push([])
    }
  }

  loading.value = false

  // Inject Font
  if (data.style && data.style.fontFamily) {
    // Basic Google Fonts mapping (same as builder)
    const fontMap = {
      'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
      'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap',
      'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap',
      'Lobster': 'https://fonts.googleapis.com/css2?family=Lobster&display=swap',
    }
    const url = fontMap[data.style.fontFamily]
    if (url && !document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    }
  }

  // Setup ResizeObserver to handle dynamic height changes
  const resizeObserver = new ResizeObserver(() => {
    notifyHeight()
  })
  resizeObserver.observe(document.body)

  // Notify initial height
  notifyHeight()

  // Apply Background to body if full page
  if (data.style && data.style.backgroundColor) {
    document.body.style.backgroundColor = data.style.backgroundColor
  }

  // Capture Metadata
  try {
    metadata.value.userAgent = navigator.userAgent
    const response = await fetch('https://ipapi.co/json/')
    if (response.ok) {
      const geoData = await response.json()
      metadata.value.ip = geoData.ip
      metadata.value.city = geoData.city
      metadata.value.region = geoData.region
      metadata.value.country = geoData.country_name
      metadata.value.org = geoData.org
    }
  } catch (e) { console.warn(e) }
})

const notifyHeight = () => {
  // Use a slight delay or requestAnimationFrame to ensure rendering is complete
  requestAnimationFrame(() => {
    // We use scrollHeight of the documentElement (html) or body to capture full content
    // But since body has min-h-screen, we might want to measure the container if we want 'fit content'.
    // If we assume the iframe should just be as tall as the content...

    // Better approach: Calculate the max of body scrollHeight or offsetHeight
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight
    )
    window.parent.postMessage({ type: 'crm-resize', height }, '*')
  })
}

const nextStep = () => {
  // Validate current step fields
  const fields = steps.value[currentStep.value]
  let valid = true

  // Basic HTML validation check
  // (In a real app, strict validation logic here)
  const formEl = document.querySelector('form')
  if (!formEl.checkValidity()) {
    formEl.reportValidity()
    return
  }

  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    window.scrollTo(0, 0)
    notifyHeight()
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    window.scrollTo(0, 0)
    notifyHeight()
  }
}

const handleSubmit = async () => {
  const { error: submitError } = await supabase
    .from('leads')
    .insert({
      form_id: formId,
      data: formData.value,
      metadata: metadata.value,
      status: 'Novo'
    })

  if (submitError) {
    alert('Erro ao enviar formulário. Tente novamente.')
    console.error(submitError)
  } else {
    submitted.value = true

    // Redirect if configured
    if (form.value.settings?.redirectUrl) {
      setTimeout(() => {
        window.location.href = form.value.settings.redirectUrl
      }, 1500)
    }

    notifyHeight()
  }
}
</script>

<template>
  <div class="p-4 flex items-center justify-center custom-root" :style="rootStyle">
    <div v-if="loading" class="text-center p-4">Carregando...</div>
    <div v-else-if="error" class="text-center text-red-500 font-bold p-4">
      {{ error }}
    </div>

    <!-- Success State -->
    <div v-else-if="submitted" class="text-center space-y-4 max-w-md mx-auto fade-in">
      <div class="h-16 w-16 rounded-full flex items-center justify-center mx-auto text-white shadow-lg"
        style="background-color: var(--primary-color)">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold" style="color: var(--text-color)">Obrigado!</h2>
      <p style="color: var(--text-color); opacity: 0.8;">
        {{ form.settings?.successMessage || 'Suas informações foram recebidas.' }}</p>
    </div>

    <!-- Form -->
    <div v-else class="w-full max-w-xl mx-auto custom-card shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="p-6 md:p-8 space-y-2 border-b border-black/5" v-if="currentStep === 0 || !form.settings?.isMultiStep">
        <h1 class="text-2xl font-bold font-custom">{{ form.title }}</h1>
        <p class="opacity-70 text-sm font-custom">{{ form.description }}</p>
      </div>

      <div class="p-6 md:p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">

          <div v-if="form.settings?.isMultiStep" class="mb-6">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold uppercase tracking-wider opacity-60">Passo {{ currentStep + 1 }} de {{
                steps.length }}</span>
            </div>
            <div class="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-300"
                :style="{ width: `${((currentStep + 1) / steps.length) * 100}%`, backgroundColor: 'var(--primary-color)' }">
              </div>
            </div>
          </div>

          <transition name="fade" mode="out-in">
            <div :key="currentStep" class="space-y-4">
              <div v-for="(field, index) in steps[currentStep]" :key="index" class="space-y-1.5">
                <Label :for="`field-${index}`" class="font-custom">
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-500">*</span>
                </Label>

                <template v-if="field.type === 'textarea'">
                  <textarea :id="`field-${index}`" v-model="formData[field.label]"
                    class="custom-input flex min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    :placeholder="field.placeholder" :required="field.required"></textarea>
                </template>
                <template v-else-if="field.type === 'select'">
                  <div class="relative">
                    <select :id="`field-${index}`" v-model="formData[field.label]" :required="field.required"
                      class="custom-input flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-transparent">
                      <option value="" disabled selected>Selecione...</option>
                      <option v-for="(opt, oIdx) in field.options" :key="oIdx" :value="opt.value">{{ opt.label }}
                      </option>
                    </select>
                    <!-- Arrow Icon -->
                    <div class="absolute right-3 top-3 pointer-events-none opacity-50">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <Input :id="`field-${index}`" :type="field.type" v-model="formData[field.label]" class="custom-input"
                    :placeholder="field.placeholder" :required="field.required" />
                </template>
              </div>
            </div>
          </transition>

          <div class="pt-4 flex items-center gap-3">
            <button v-if="currentStep > 0" type="button" @click="prevStep"
              class="px-6 py-2.5 rounded text-sm font-medium border border-black/10 hover:bg-black/5 transition-colors"
              style="border-radius: var(--btn-radius)">
              Voltar
            </button>

            <button v-if="currentStep < steps.length - 1" type="button" @click="nextStep"
              class="flex-1 px-6 py-2.5 rounded text-sm font-medium text-white shadow-md hover:opacity-90 transition-opacity"
              style="background-color: var(--primary-color); border-radius: var(--btn-radius)">
              Próximo
            </button>

            <button v-else type="submit"
              class="flex-1 px-6 py-2.5 rounded text-sm font-medium text-white shadow-md hover:opacity-90 transition-opacity"
              style="background-color: var(--primary-color); border-radius: var(--btn-radius)">
              Enviar
            </button>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-4 bg-black/5 border-t border-black/5 text-center text-[10px] uppercase tracking-widest opacity-40 font-custom">
        Secured by SimpleCRM
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-root {
  font-family: var(--font-family, sans-serif);
  color: var(--text-color);
  /* The background color is applied to body in script, or here if scoped allows but usually better on root element of component if taking full page */
}

.custom-card {
  background-color: var(--bg-color);
  border-radius: var(--radius);
  color: var(--text-color);
}

.font-custom {
  font-family: var(--font-family, sans-serif);
}

.custom-input {
  /* We want to inherit global styling but keep structure */
  background-color: rgba(255, 255, 255, 0.05);
  /* Slight tint */
  border-color: rgba(0, 0, 0, 0.1);
}

/* Light/Dark adaption helper */
@media (prefers-color-scheme: dark) {
  .custom-input {
    border-color: rgba(255, 255, 255, 0.1);
    background-color: rgba(0, 0, 0, 0.2);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
