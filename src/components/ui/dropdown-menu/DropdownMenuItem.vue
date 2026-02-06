<script setup>
import { DropdownMenuItem, useForwardPropsEmits } from 'radix-vue'

const props = defineProps({
    disabled: { type: Boolean, default: false },
    textValue: { type: String, default: '' },
    asChild: { type: Boolean, default: false },
    as: { type: [String, Object], default: undefined },
    class: { type: String, default: '' },
})
const emits = defineEmits(['select'])
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
    <DropdownMenuItem v-bind="forwarded" :class="[
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class
    ]">
        <slot />
    </DropdownMenuItem>
</template>
