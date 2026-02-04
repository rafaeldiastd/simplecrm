<script setup>
import { SelectRoot, useForwardPropsEmits } from 'radix-vue'

const props = defineProps({
    modelValue: { type: [String, Number, Object], default: '' },
    defaultValue: { type: [String, Number, Object], default: '' },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: false },
})
const emits = defineEmits(['update:modelValue', 'update:open'])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
    <SelectRoot v-bind="forwarded">
        <slot />
    </SelectRoot>
</template>
