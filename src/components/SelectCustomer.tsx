import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "../components/ui/command";
import { Button } from "../components/ui/button";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

type CustomerOption = {
  id: string | number;
  name: string;
};

type SelectCustomerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedCustomerId: string | number | null;
  setSelectedCustomer: React.Dispatch<
    React.SetStateAction<string | number | null>
  >;
  customers: CustomerOption[];
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
};

export default function SelectCustomer({
  open,
  setOpen,
  selectedCustomerId,
  setSelectedCustomer,
  customers,
  search,
  setSearch,
  loading,
}: SelectCustomerProps) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=" w-[200px] justify-between "
        >
          {selectedCustomer ? selectedCustomer.name : "เลือกบริษัทลูกค้า"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground max-h-[200px]">
          <CommandInput
            placeholder="ค้นหาบริษัท..."
            value={search}
            onValueChange={(value) => setSearch(value)}
          />
          <CommandList>
            {loading && (
              <div className="p-2 text-sm text-muted-foreground">
                กำลังโหลด...
              </div>
            )}
            <CommandEmpty>ไม่พบลูกค้า</CommandEmpty>
            <CommandGroup>
              {customers
                .filter((customer) => customer.id !== selectedCustomerId)
                .map((customer) => (
                  <CommandItem
                    key={customer.id}
                    className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                    onSelect={() => {
                      setSelectedCustomer(customer.id);
                      setOpen(false);
                    }}
                  >
                    {customer.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCustomer === customer
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
