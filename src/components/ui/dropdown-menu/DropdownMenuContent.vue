<script setup>
import { DropdownMenuContent, DropdownMenuPortal, useForwardPropsEmits } from 'radix-vue'
import { computed } from 'vue'

const props = defineProps({
    forceMount: { type: Boolean, default: undefined },
    side: { type: String, default: 'bottom' },
    sideOffset: { type: Number, default: 4 },
    align: { type: String, default: 'center' },
    alignOffset: { type: Number, default: 0 },
    avoidCollisions: { type: Boolean, default: true },
    collisionBoundary: { type: [Object, Array], default: undefined },
    collisionPadding: { type: [Number, Object], default: 0 },
    arrowPadding: { type: Number, default: 0 },
    sticky: { type: String, default: 'partial' },
    hideWhenDetached: { type: Boolean, default: false },
    updatePositionStrategy: { type: String, default: 'optimized' },
    prioritizePosition: { type: Boolean, default: false },
    class: { type: String, default: '' },
})
const emits = defineEmits(['escapeKeyDown', 'pointerDownOutside', 'focusOutside', 'interactOutside', 'dismiss', 'entryFocus', 'closeAutoFocus'])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
    <DropdownMenuPortal>
        <DropdownMenuContent v-bind="forwarded" :class="[
            'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            props.class
        ]">
            <slot />
        </DropdownMenuContent>
    </DropdownMenuPortal>
</template>
