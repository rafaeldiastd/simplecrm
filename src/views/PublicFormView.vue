<script setup>
import { ref, onMounted } from 'vue'
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
  // Initialize form data model
  if (data.schema) {
    data.schema.forEach(field => {
      formData.value[field.label] = ''
    })
  }
  loading.value = false

  // Notify parent window about height change (for iframe embedding)
  notifyHeight()

  // 2. Capture Metadata (IP, Location, User Agent)
  try {
    metadata.value.userAgent = navigator.userAgent

    // Fetch IP and Location info
    const response = await fetch('https://ipapi.co/json/')
    if (response.ok) {
      const geoData = await response.json()
      metadata.value.ip = geoData.ip
      metadata.value.city = geoData.city
      metadata.value.region = geoData.region
      metadata.value.country = geoData.country_name
      metadata.value.org = geoData.org
    }
  } catch (e) {
    console.warn('Falha ao capturar metadados do usuário', e)
  }
})

const notifyHeight = () => {
  // Small delay to ensure DOM is rendered
  setTimeout(() => {
    const height = document.body.scrollHeight
    window.parent.postMessage({ type: 'crm-resize', height }, '*')
  }, 100)
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
    notifyHeight()
  }
}
</script>

<template>
  <div class="min-h-screen bg-background p-4 flex items-center justify-center">
    <div v-if="loading" class="text-center">Carregando...</div>
    <div v-else-if="error" class="text-center text-destructive">
      <h1 class="text-xl font-bold">Erro</h1>
      <p>{{ error }}</p>
    </div>
    <div v-else-if="submitted" class="text-center space-y-4 max-w-md mx-auto">
      <div class="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-check">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold">Obrigado!</h2>
      <p class="text-muted-foreground">Suas informações foram recebidas com sucesso.</p>
    </div>

    <Card v-else class="w-full max-w-lg shadow-lg border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle class="text-2xl">{{ form.title }}</CardTitle>
        <p v-if="form.description" class="text-muted-foreground">{{ form.description }}</p>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-for="(field, index) in form.schema" :key="index" class="space-y-2">
            <Label :for="`field-${index}`">
              {{ field.label }}
              <span v-if="field.required" class="text-destructive">*</span>
            </Label>

            <template v-if="field.type === 'textarea'">
              <textarea :id="`field-${index}`" v-model="formData[field.label]"
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                :placeholder="field.placeholder" :required="field.required"></textarea>
            </template>
            <template v-else-if="field.type === 'select'">
              <Select v-model="formData[field.label]" :required="field.required">
                <SelectTrigger :id="`field-${index}`">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="(opt, optIdx) in field.options" :key="optIdx" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <!-- Hidden input to enforce required on native form submission if needed, though Select handles v-model validation usually handled by custom logic or simple check -->
            </template>
            <template v-else>
              <Input :id="`field-${index}`" :type="field.type" v-model="formData[field.label]"
                :placeholder="field.placeholder" :required="field.required" />
            </template>
          </div>

          <Button type="submit" class="w-full">Enviar</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
