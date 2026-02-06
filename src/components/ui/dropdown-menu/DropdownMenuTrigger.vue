<script setup>
import { DropdownMenuTrigger, useForwardProps } from 'radix-vue'

const props = defineProps({
    disabled: { type: Boolean, default: false },
})
const forwarded = useForwardProps(props)
</script>

<template>
    <DropdownMenuTrigger class="outline-none" v-bind="forwarded">
        <slot />
    </DropdownMenuTrigger>
</template>
