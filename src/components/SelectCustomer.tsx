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
import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";

type CustomerOption = {
  id: string | number;
  name: string;
};

type SelectCustomerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedCustomerId: string | number | null;
  setSelectedCustomer: (customerId: string | number | null) => void;
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
  const [inputValue, setInputValue] = useState(search);
  const debounceSearch = useDebounce(inputValue, 400);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  useEffect(() => {
    setSearch(debounceSearch);
  }, [debounceSearch, setSearch]);

  const filteredCustomers = useMemo(() => {
    const searchLower = debounceSearch.trim().toLowerCase();

    return customers.filter((customer) => {
      if (customer.id === selectedCustomerId) return false;
      if (!searchLower) return true;

      return customer.name.toLowerCase().includes(searchLower);
    });
  }, [customers, debounceSearch, selectedCustomerId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between overflow-hidden"
          title={selectedCustomer ? selectedCustomer.name : "เลือกบริษัทลูกค้า"}
        >
          <span className="block w-full truncate text-left">
            {selectedCustomer ? selectedCustomer.name : "เลือกบริษัทลูกค้า"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command
          shouldFilter={false}
          className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground max-h-[200px]"
        >
          <CommandInput
            placeholder="ค้นหาบริษัท..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {loading && (
              <div className="p-2 text-sm text-muted-foreground">
                กำลังโหลด...
              </div>
            )}
            <CommandEmpty>ไม่พบลูกค้า</CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                  onSelect={() => {
                    setSelectedCustomer(customer.id);
                    setInputValue("");
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  {customer.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCustomerId === customer.id
                        ? "opacity-100"
                        : "opacity-0",
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
