<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, TrendingUp, Trophy, XCircle, Activity } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'

const loading = ref(true)
const stats = ref({
  totalLeads: 0,
  wonLeads: 0,
  lostLeads: 0,
  conversionRate: 0,
  byStage: {},
  recentLeads: []
})

// Colors for known stages to make the chart look nice
const stageColors = {
  'Novo': 'bg-blue-500',
  'Contatado': 'bg-yellow-500',
  'Qualificado': 'bg-purple-500',
  'Proposta': 'bg-indigo-500',
  'Ganho': 'bg-green-500',
  'Perdido': 'bg-red-500'
}

onMounted(async () => {
  loading.value = true

  // 1. Fetch Stats (Status counts)
  // Since we don't have a huge DB, we can just fetch 'status' column for all leads and aggregate in JS
  const { data: allLeads, error: statsError } = await supabase
    .from('leads')
    .select('status')

  if (!statsError && allLeads) {
    const total = allLeads.length
    const byStage = {}
    let won = 0
    let lost = 0

    allLeads.forEach(l => {
      const s = l.status || 'Novo'
      byStage[s] = (byStage[s] || 0) + 1

      if (s.toLowerCase() === 'ganho') won++
      if (s.toLowerCase() === 'perdido') lost++
    })

    stats.value.totalLeads = total
    stats.value.wonLeads = won
    stats.value.lostLeads = lost
    stats.value.byStage = byStage
    stats.value.conversionRate = total > 0 ? Math.round((won / total) * 100) : 0
  }

  // 2. Fetch Recent Leads (Full Data)
  const { data: recent, error: recentError } = await supabase
    .from('leads')
    .select('*, forms(title)')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!recentError) {
    stats.value.recentLeads = recent
  }

  loading.value = false
})

const sortedStages = computed(() => {
  // Sort primarily by value desc? or by a logical pipeline order if we knew it?
  // Let's sort by Count Descending for "Interesting Data" look
  return Object.entries(stats.value.byStage)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / stats.value.totalLeads) * 100)
    }))
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold tracking-tight">Painel de Controle</h1>
      <div class="text-sm text-muted-foreground">Visão geral do sistema</div>
    </div>

    <!-- KPI Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total de Leads</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-16" />
            <Skeleton class="h-3 w-24" />
          </div>
          <div v-else>
            <div class="text-2xl font-bold">{{ stats.totalLeads }}</div>
            <p class="text-xs text-muted-foreground">Em todas as etapas</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Taxa de Conversão</CardTitle>
          <Activity class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-16" />
            <Skeleton class="h-3 w-24" />
          </div>
          <div v-else>
            <div class="text-2xl font-bold">{{ stats.conversionRate }}%</div>
            <p class="text-xs text-muted-foreground">Leads marcados como 'Ganho'</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Negócios Ganhos</CardTitle>
          <Trophy class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-16" />
            <Skeleton class="h-3 w-24" />
          </div>
          <div v-else>
            <div class="text-2xl font-bold text-green-600">{{ stats.wonLeads }}</div>
            <p class="text-xs text-muted-foreground">Sucesso total</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Perdidos</CardTitle>
          <XCircle class="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-16" />
            <Skeleton class="h-3 w-24" />
          </div>
          <div v-else>
            <div class="text-2xl font-bold text-red-500">{{ stats.lostLeads }}</div>
            <p class="text-xs text-muted-foreground">Oportunidades encerradas</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

      <!-- Stage Distribution Chart (Simple Bars) -->
      <Card class="col-span-4">
        <CardHeader>
          <CardTitle>Distribuição do Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <Skeleton class="h-8 w-full" v-for="i in 4" :key="i" />
          </div>
          <div v-else class="space-y-4">
            <div v-if="stats.totalLeads === 0" class="text-center text-muted-foreground py-8">
              Sem dados suficientes para exibir o gráfico.
            </div>
            <div v-else v-for="item in sortedStages" :key="item.name" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-muted-foreground">{{ item.count }} ({{ item.percent }}%)</span>
              </div>
              <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="stageColors[item.name] || 'bg-primary'" :style="{ width: `${item.percent}%` }"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity -->
      <Card class="col-span-3">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-4">
            <Skeleton class="h-16 w-full" v-for="i in 3" :key="i" />
          </div>
          <div v-else class="space-y-4">
            <div v-for="lead in stats.recentLeads" :key="lead.id"
              class="flex items-center justify-between border-b last:border-0 last:pb-0 pb-4">
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none">{{ lead.forms?.title || 'Formulário' }}</p>
                <p class="text-xs text-muted-foreground">{{ new Date(lead.created_at).toLocaleDateString('pt-BR') }}</p>
              </div>
              <div class="font-medium text-xs px-2 py-1 rounded-full bg-muted">
                {{ lead.status || 'Novo' }}
              </div>
            </div>
            <div v-if="stats.recentLeads.length === 0" class="text-muted-foreground text-sm text-center py-4">
              Nenhuma atividade recente.
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  </div>
</template>
