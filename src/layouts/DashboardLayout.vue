<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { LayoutDashboard, Users, FilePlus } from 'lucide-vue-next'
</script>

<template>
  <div class="flex h-screen bg-muted/40">
    <!-- Sidebar -->
    <aside class="hidden w-64 border-r bg-background md:flex md:flex-col">
      <div class="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <a href="/" class="flex items-center gap-2 font-semibold">
          <LayoutDashboard class="h-6 w-6" />
          <span class="">Simple CRM</span>
        </a>
      </div>
      <div class="flex-1 overflow-auto py-2">
        <nav class="grid items-start px-2 text-sm font-medium lg:px-4">
          <RouterLink
            to="/"
            class="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary"
            active-class="bg-muted text-primary"
          >
            <LayoutDashboard class="h-4 w-4" />
            Dashboard
          </RouterLink>
          <RouterLink
            to="/leads"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            active-class="bg-muted text-primary"
          >
            <Users class="h-4 w-4" />
            Leads
          </RouterLink>
          <RouterLink
            to="/builder"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            active-class="bg-muted text-primary"
          >
            <FilePlus class="h-4 w-4" />
            Form Builder
          </RouterLink>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex flex-col flex-1">
      <header class="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <!-- Mobile Sidebar trigger could go here -->
        <h1 class="font-semibold text-lg">Platform</h1>
      </header>
      <main class="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
