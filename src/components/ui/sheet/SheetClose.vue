<script setup>
import { DialogClose } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
    class: { type: String, default: '' },
})
</script>

<template>
    <DialogClose
        :class="cn('opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary', props.class)">
        <slot />
    </DialogClose>
</template>
