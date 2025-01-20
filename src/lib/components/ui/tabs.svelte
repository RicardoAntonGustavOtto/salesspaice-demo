<!-- @format -->
<script lang="ts">
  import { Tabs as TabsPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  type $$Props = TabsPrimitive.Props;

  export let value: $$Props["value"] = undefined;
  export let onValueChange: $$Props["onValueChange"] = undefined;
  export let class: $$Props["class"] = undefined;
</script>

<TabsPrimitive.Root
  {value}
  {onValueChange}
  class={cn("w-full", class)}
  {...$$restProps}
>
  <slot />
</TabsPrimitive.Root>

<script context="module" lang="ts">
  export {
    Root,
    Content as TabsContent,
    List as TabsList,
    Trigger as TabsTrigger,
  } from "bits-ui/tabs";
</script> 