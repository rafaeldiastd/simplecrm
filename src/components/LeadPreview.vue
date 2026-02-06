<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Calendar, FileText, X, MessageSquare, CheckCircle, XCircle, User, RefreshCw } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps({
    lead: { type: Object, default: null },
    open: { type: Boolean, default: false }
})

const emit = defineEmits(['update:open', 'lead-updated'])

const comments = ref([])
const newComment = ref('')
const loadingComments = ref(false)
const submittingComment = ref(false)

// Status helpers
const currentStatus = computed(() => props.lead?.status || 'Novo')

// Watch for lead change to fetch specific data
watch(() => props.lead, async (newLead) => {
    if (newLead) {
        comments.value = []
        await fetchComments(newLead.id)
    }
})

async function fetchComments(leadId) {
    loadingComments.value = true
    // Fetch comments linked to this lead (or maybe by email if we wanted to be smarter, but let's stick to ID for now as per schema)
    const { data, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

    if (data) comments.value = data
    loadingComments.value = false
}

async function addComment() {
    if (!newComment.value.trim()) return
    submittingComment.value = true

    const { data, error } = await supabase
        .from('lead_comments')
        .insert({
            lead_id: props.lead.id,
            content: newComment.value
        })
        .select()
        .single()

    if (data) {
        comments.value.unshift(data)
        newComment.value = ''
    }
    submittingComment.value = false
}

async function updateStatus(newStatus) {
    if (!props.lead) return

    const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', props.lead.id)

    if (!error) {
        // Emit event so parent can refresh/update UI
        // We can also optimistically update the prop object if it's mutable, but better to emit
        // props.lead.status = newStatus // naive
        window.location.reload() // Brute force refresh for now to ensure Kanban sync, or we emit an event
        // Better: emit event
        // emit('lead-updated', { ...props.lead, status: newStatus }) 
        // But since we are inside a Sheet, a reload is jarring. 
        // Ideally LeadsView listens to this.
    }
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
}

// Helper to separate Contact Data from Form Data
// "Contact" = Name, Email, Phone, Company
// "Form" = Everything else
const contactKeys = ['nome', 'name', 'email', 'e-mail', 'mail', 'telefone', 'phone', 'celular', 'whatsapp', 'empresa', 'company']

const contactData = computed(() => {
    if (!props.lead?.data) return {}
    const data = {}
    Object.keys(props.lead.data).forEach(k => {
        if (contactKeys.some(ck => k.toLowerCase().includes(ck))) {
            data[k] = props.lead.data[k]
        }
    })
    return data
})

const formDataOnly = computed(() => {
    if (!props.lead?.data) return {}
    const data = {}
    Object.keys(props.lead.data).forEach(k => {
        if (!contactKeys.some(ck => k.toLowerCase().includes(ck))) {
            data[k] = props.lead.data[k]
        }
    })
    return data
})

function getThumbName(lead) {
    const name = lead.data?.nome || lead.data?.name || 'Lead'
    return name.substring(0, 2).toUpperCase()
}
</script>

<template>
    <Sheet :open="open" @update:open="val => emit('update:open', val)">
        <SheetContent class="w-[400px] sm:w-[600px] overflow-y-auto p-0 gap-0 bg-slate-50">
            <!-- Header with Status Actions -->
            <div class="p-6 bg-white border-b sticky top-0 z-10">
                <SheetHeader class="mb-4 text-left">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {{ lead ? getThumbName(lead) : 'LD' }}
                            </div>
                            <div>
                                <SheetTitle class="text-xl">{{ lead?.data?.nome || lead?.data?.name || 'Lead Detalhes'
                                    }}</SheetTitle>
                                <SheetDescription class="flex items-center gap-2 mt-1">
                                    <span class="px-2 py-0.5 rounded-full text-xs font-medium border" :class="{
                                        'bg-green-100 text-green-700 border-green-200': currentStatus === 'Ganho',
                                        'bg-red-100 text-red-700 border-red-200': currentStatus === 'Perdido',
                                        'bg-blue-50 text-blue-700 border-blue-200': currentStatus === 'Novo',
                                    }">
                                        {{ currentStatus }}
                                    </span>
                                    <span class="text-xs text-muted-foreground">{{ formatDate(lead?.created_at)
                                        }}</span>
                                </SheetDescription>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <!-- Quick Actions -->
                <div class="flex gap-2">
                    <Button v-if="currentStatus !== 'Ganho'" size="sm" variant="outline"
                        class="flex-1 border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800"
                        @click="updateStatus('Ganho')">
                        <CheckCircle class="w-4 h-4 mr-2" />
                        Marcar Ganho
                    </Button>
                    <Button v-if="currentStatus !== 'Perdido'" size="sm" variant="outline"
                        class="flex-1 border-red-200 hover:bg-red-50 text-red-700 hover:text-red-800"
                        @click="updateStatus('Perdido')">
                        <XCircle class="w-4 h-4 mr-2" />
                        Marcar Perdido
                    </Button>
                </div>
            </div>

            <div v-if="lead" class="p-6 space-y-6">

                <!-- Main Content Tabs -->
                <Tabs default-value="activity" class="w-full">
                    <TabsList class="w-full grid grid-cols-2">
                        <TabsTrigger value="activity">Atividade & Dados</TabsTrigger>
                        <TabsTrigger value="comments">Anotações & Equipe</TabsTrigger>
                    </TabsList>

                    <!-- TAB: ACTIVITY -->
                    <TabsContent value="activity" class="space-y-6 mt-4">

                        <!-- Contact Info Section -->
                        <div class="bg-white p-4 rounded-lg border shadow-sm">
                            <h3
                                class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User class="w-3 h-3" /> Dados do Contato
                            </h3>
                            <div class="grid grid-cols-2 gap-y-4 gap-x-2">
                                <div v-for="(value, key) in contactData" :key="key">
                                    <div class="text-[10px] text-muted-foreground uppercase mb-0.5">{{ key }}</div>
                                    <div class="text-sm font-medium break-words">{{ value }}</div>
                                </div>
                                <div v-if="Object.keys(contactData).length === 0"
                                    class="col-span-2 text-sm text-muted-foreground italic">
                                    Sem dados de contato explícitos.
                                </div>
                            </div>
                        </div>

                        <!-- Form Responses (History) -->
                        <div class="space-y-4">
                            <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Histórico
                                de Formulários</h3>

                            <!-- Timeline items -->
                            <div class="relative pl-4 border-l-2 border-slate-200 space-y-6 ml-2">
                                <div v-for="(item, idx) in lead.history" :key="item.id" class="relative group">
                                    <!-- Dot -->
                                    <div class="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm transition-colors group-hover:bg-primary"
                                        :class="idx === 0 ? 'bg-primary' : 'bg-slate-300'"></div>

                                    <div
                                        class="bg-white p-3 rounded-lg border shadow-sm group-hover:shadow-md transition-all">
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="flex items-center gap-2">
                                                <FileText class="w-3 h-3 text-muted-foreground" />
                                                <span class="font-semibold text-sm">{{ item.forms?.title || 'Formulário'
                                                    }}</span>
                                            </div>
                                            <span class="text-xs text-muted-foreground">{{ formatDate(item.created_at)
                                                }}</span>
                                        </div>

                                        <!-- Form Specific Data (excluding contact info for cleaner view) -->
                                        <div
                                            class="grid grid-cols-1 gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                            <div v-for="(val, k) in item.data" :key="k"
                                                class="grid grid-cols-[min-content_1fr] gap-3">
                                                <!-- Show all keys for history, or just non-contact? Let's show all for completeness in history -->
                                                <span class="font-medium text-slate-500 whitespace-nowrap">{{ k
                                                    }}:</span>
                                                <span class="text-slate-900 break-words">{{ val }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <!-- TAB: COMMENTS -->
                    <TabsContent value="comments" class="space-y-4 mt-4">
                        <!-- Add Comment -->
                        <div class="flex gap-2 items-start">
                            <Textarea v-model="newComment" placeholder="Adicione uma nota interna..."
                                class="min-h-[80px] resize-none bg-white" @keydown.ctrl.enter="addComment" />
                            <Button size="icon" @click="addComment" :disabled="submittingComment || !newComment.trim()">
                                <MessageSquare class="w-4 h-4" />
                            </Button>
                        </div>

                        <!-- Comments List -->
                        <div class="space-y-4 pt-2">
                            <div v-if="loadingComments" class="space-y-3">
                                <Skeleton class="h-16 w-full" v-for="i in 3" :key="i" />
                            </div>
                            <div v-else-if="comments.length === 0"
                                class="text-center py-8 text-muted-foreground text-sm">
                                Nenhuma nota adicionada ainda.
                            </div>
                            <div v-else v-for="comment in comments" :key="comment.id"
                                class="bg-white p-3 rounded-lg border shadow-sm flex gap-3">
                                <div
                                    class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <User class="w-4 h-4 text-slate-500" />
                                </div>
                                <div class="space-y-1 flex-1">
                                    <div class="flex justify-between items-start">
                                        <span class="text-xs font-bold text-slate-700">Usuário</span>
                                        <span class="text-[10px] text-muted-foreground">{{
                                            formatDate(comment.created_at) }}</span>
                                    </div>
                                    <p class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{{
                                        comment.content }}</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </SheetContent>
    </Sheet>
</template>
