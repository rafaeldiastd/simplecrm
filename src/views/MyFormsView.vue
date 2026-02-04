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
import { RouterLink } from 'vue-router'
import { Edit, Trash, Eye } from 'lucide-vue-next'

const forms = ref([])
const loading = ref(true)

async function fetchForms() {
    loading.value = true
    const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erro ao buscar formulários:', error)
    } else {
        forms.value = data
    }
    loading.value = false
}

async function deleteForm(id) {
    if (!confirm('Tem certeza que deseja excluir este formulário? Todas as respostas serão perdidas.')) return

    const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', id)

    if (error) {
        alert('Erro ao excluir formulário')
        console.error(error)
    } else {
        fetchForms()
    }
}

function getPublicUrl(id) {
    return `${window.location.origin}/form/${id}`
}

onMounted(() => {
    fetchForms()
})
</script>

<template>
    <div class="h-full flex flex-col space-y-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold tracking-tight">Meus Formulários</h1>
                <p class="text-muted-foreground">Gerencie seus formulários de captura.</p>
            </div>
            <Button as-child>
                <RouterLink to="/builder">Novo Formulário</RouterLink>
            </Button>
        </div>

        <div class="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead class="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow v-if="loading">
                        <TableCell colSpan="3" class="text-center h-24">
                            Carregando...
                        </TableCell>
                    </TableRow>
                    <TableRow v-else-if="forms.length === 0">
                        <TableCell colSpan="3" class="text-center h-24 text-muted-foreground">
                            Nenhum formulário encontrado.
                        </TableCell>
                    </TableRow>
                    <TableRow v-else v-for="form in forms" :key="form.id">
                        <TableCell class="font-medium">
                            <div>{{ form.title }}</div>
                            <div class="text-xs text-muted-foreground truncate max-w-[300px]">{{ form.description }}
                            </div>
                        </TableCell>
                        <TableCell>{{ new Date(form.created_at).toLocaleDateString('pt-BR') }}</TableCell>
                        <TableCell class="text-right">
                            <div class="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" as-child title="Ver Público">
                                    <a :href="getPublicUrl(form.id)" target="_blank">
                                        <Eye class="h-4 w-4" />
                                    </a>
                                </Button>
                                <Button variant="ghost" size="icon" as-child title="Editar">
                                    <RouterLink :to="`/builder/${form.id}`">
                                        <Edit class="h-4 w-4" />
                                    </RouterLink>
                                </Button>
                                <Button variant="ghost" size="icon" @click="deleteForm(form.id)"
                                    class="text-destructive hover:text-destructive" title="Excluir">
                                    <Trash class="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    </div>
</template>
