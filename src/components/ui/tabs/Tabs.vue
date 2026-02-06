<script setup>
import { TabsRoot, useForwardPropsEmits } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
    defaultValue: { type: String, required: false },
    orientation: { type: String, required: false },
    dir: { type: String, required: false },
    activationMode: { type: String, required: false },
    modelValue: { type: String, required: false },
    class: { type: String, required: false }
})
const emits = defineEmits(['update:modelValue'])
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
    <TabsRoot v-bind="forwarded" :class="cn('', props.class)">
        <slot />
    </TabsRoot>
</template>
