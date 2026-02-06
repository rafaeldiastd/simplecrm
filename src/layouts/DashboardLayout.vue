<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { LayoutDashboard, Users, FilePlus, Settings } from 'lucide-vue-next'
</script>

<template>
  <div class="flex h-screen bg-muted/40 font-sans">
    <!-- Sidebar -->
    <aside class="hidden w-64 flex-col border-r bg-background md:flex">
      <div class="flex h-16 items-center border-b px-6">
        <a href="/" class="flex items-center gap-2 font-bold text-lg tracking-tight">
          <LayoutDashboard class="h-6 w-6 text-primary" />
          <span class="text-foreground">Simple CRM</span>
        </a>
      </div>
      <div class="flex-1 overflow-auto py-6 px-4">
        <nav class="flex flex-col gap-1.5">
          <RouterLink to="/"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
            exact-active-class="bg-primary/10 text-primary font-semibold">
            <LayoutDashboard class="h-4 w-4" />
            Painel
          </RouterLink>
          <RouterLink to="/forms"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
            active-class="bg-primary/10 text-primary hover:bg-primary/10 font-semibold">
            <FilePlus class="h-4 w-4" />
            Formulários
          </RouterLink>
          <RouterLink to="/leads"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
            active-class="bg-primary/10 text-primary hover:bg-primary/10 font-semibold">
            <Users class="h-4 w-4" />
            Leads
          </RouterLink>
          <RouterLink to="/settings"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
            active-class="bg-primary/10 text-primary hover:bg-primary/10 font-semibold">
            <Settings class="h-4 w-4" />
            Configurações
          </RouterLink>
        </nav>
      </div>
      <!-- User Footer -->
      <div class="border-t p-4">
        <div class="flex items-center gap-3 rounded-md border p-3 bg-card shadow-sm">
          <div
            class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">U
          </div>
          <div class="text-xs">
            <div class="font-medium">Usuário</div>
            <div class="text-muted-foreground text-[10px]">admin@simplecrm.com</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <header class="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 shrink-0 z-10">
        <!-- Breadcrumb or Title -->
        <h1 class="font-semibold text-lg text-foreground">Plataforma</h1>
      </header>
      <main class="flex flex-1 flex-col overflow-hidden p-4 lg:p-6 bg-slate-50/50">
        <RouterView />
      </main>
    </div>
  </div>
</template>
