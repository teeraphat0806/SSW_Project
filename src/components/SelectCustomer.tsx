import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SelectCustomer({
    open,
    setOpen,
    selectedCustomer,
    setSelectedCustomer,
    customers,
}) {
    return (
        <Popover open={open} onOpenChange={setOpen} >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className=" w-[200px] justify-between "
              >
                {selectedCustomer || "เลือกบริษัทลูกค้า"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground max-h-[200px]">
                <CommandInput placeholder="ค้นหาบริษัท..." />
                <CommandList>
                  <CommandEmpty>ไม่พบลูกค้า</CommandEmpty>
                  <CommandGroup>
                    {customers.filter((customer) => customer !== selectedCustomer)
                    .map((customer) => (
                      <CommandItem
                        key={customer}
                        className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                        onSelect={() => {
                          setSelectedCustomer(customer);
                          setOpen(false);
                        }}
                      >
                        {customer}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedCustomer === customer ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
    )
}
