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

const leads = ref([])
const loading = ref(true)

async function fetchLeads() {
  loading.value = true
  const { data, error } = await supabase
    .from('leads')
    .select(`
      id,
      submitted_at,
      data,
      forms (
        title
      )
    `)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  } else {
    leads.value = data
  }
  loading.value = false
}

onMounted(() => {
  fetchLeads()
})
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Leads</h1>
        <p class="text-muted-foreground">Here you will see all captured leads.</p>
      </div>
      <Button @click="fetchLeads" variant="outline" size="sm">
        Refresh
      </Button>
    </div>

    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source Form</TableHead>
            <TableHead>Submission Date</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colSpan="3" class="text-center h-24">
              Loading...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="leads.length === 0">
            <TableCell colSpan="3" class="text-center h-24 text-muted-foreground">
              No leads found.
            </TableCell>
          </TableRow>
          <TableRow v-else v-for="lead in leads" :key="lead.id">
            <TableCell class="font-medium">{{ lead.forms?.title || 'Unknown Form' }}</TableCell>
            <TableCell>{{ new Date(lead.submitted_at).toLocaleString() }}</TableCell>
            <TableCell>
              <pre class="text-xs">{{ JSON.stringify(lead.data, null, 2) }}</pre>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
