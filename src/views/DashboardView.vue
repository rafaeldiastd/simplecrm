<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-vue-next'

const stats = ref({
  totalLeads: 0,
  recentLeads: []
})

onMounted(async () => {
  // Get count
  const { count, error: countError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  if (!countError) {
    stats.value.totalLeads = count
  }

  // Get recent
  const { data, error: dataError } = await supabase
    .from('leads')
    .select('*, forms(title)')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!dataError) {
    stats.value.recentLeads = data
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold tracking-tight">Painel de Controle</h1>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Total de Leads
          </CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalLeads }}</div>
          <p class="text-xs text-muted-foreground">
            Total de leads capturados
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Leads Recentes</h2>
      <div class="grid gap-4">
        <Card v-for="lead in stats.recentLeads" :key="lead.id">
          <CardContent class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="font-medium">{{ lead.forms?.title || 'Formulário Desconhecido' }}</div>
              <div class="text-sm text-muted-foreground">{{ new Date(lead.created_at).toLocaleString('pt-BR') }}</div>
            </div>
            <div class="text-sm bg-muted p-2 rounded max-w-md overflow-hidden truncate">
              {{ JSON.stringify(lead.data) }}
            </div>
          </CardContent>
        </Card>
        <div v-if="stats.recentLeads.length === 0" class="text-muted-foreground text-sm">
          Nenhum lead recente.
        </div>
      </div>
    </div>
  </div>
</template>
