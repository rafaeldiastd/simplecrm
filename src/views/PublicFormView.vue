<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const route = useRoute()
const formId = route.params.id
const loading = ref(true)
const submitting = ref(false)
const success = ref(false)
const form = ref(null)
const formData = ref({})

// Fetch form definition
onMounted(async () => {
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single()

  if (error || !data) {
    console.error('Error fetching form:', error)
    alert('Form not found')
    // Handle error (e.g. redirect or show error)
  } else {
    form.value = data
    // Initialize form data model
    if (data.schema && Array.isArray(data.schema)) {
      data.schema.forEach(field => {
        formData.value[field.label] = ''
      })
    }
  }
  loading.value = false

  // Notify parent if in iframe
  sendHeight()
})

async function submitForm() {
  submitting.value = true

  const { error } = await supabase
    .from('leads')
    .insert({
      form_id: formId,
      data: formData.value
    })

  submitting.value = false

  if (error) {
    console.error('Error submitting lead:', error)
    alert('Failed to submit form.')
  } else {
    success.value = true
    sendHeight()
  }
}

// Helper to send height to parent (for embed)
function sendHeight() {
  // Small delay to allow DOM to update
  setTimeout(() => {
    const height = document.body.scrollHeight
    window.parent.postMessage({ type: 'crm-resize', height }, '*')
  }, 100)
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div v-if="loading">Loading form...</div>

    <div v-else-if="!form" class="text-destructive">Form not found.</div>

    <Card v-else-if="!success" class="w-full max-w-lg border-none shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle>{{ form.title }}</CardTitle>
        <p class="text-muted-foreground text-sm" v-if="form.description">{{ form.description }}</p>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div v-for="(field, index) in form.schema" :key="index" class="grid gap-2">
            <Label :for="'field-' + index">{{ field.label }}</Label>

            <template v-if="field.type === 'textarea'">
              <textarea :id="'field-' + index" v-model="formData[field.label]" :placeholder="field.placeholder" required
                class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            </template>
            <template v-else>
              <Input :id="'field-' + index" :type="field.type" v-model="formData[field.label]"
                :placeholder="field.placeholder" required />
            </template>
          </div>

          <Button type="submit" class="w-full" :disabled="submitting">
            {{ submitting ? 'Submitting...' : 'Submit' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <div v-else class="text-center space-y-4 p-8">
      <div class="text-4xl">🎉</div>
      <h2 class="text-2xl font-bold">Thank You!</h2>
      <p class="text-muted-foreground">Your submission has been received.</p>
    </div>
  </div>
</template>
