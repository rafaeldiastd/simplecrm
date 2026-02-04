<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
    for: { type: String, default: undefined },
    as: { type: String, default: 'label' },
    class: { type: String, default: '' },
})
</script>

<template>
    <component :is="as" :for="props.for"
        :class="cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', props.class)">
        <slot />
    </component>
</template>
