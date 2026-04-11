import React, { useState } from 'react';
import { categoriesApi } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Tags } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const colorOptions = [
  { cls: 'bg-emerald-500', label: 'Green' },
  { cls: 'bg-blue-500',    label: 'Blue' },
  { cls: 'bg-purple-500',  label: 'Purple' },
  { cls: 'bg-orange-500',  label: 'Orange' },
  { cls: 'bg-pink-500',    label: 'Pink' },
  { cls: 'bg-cyan-500',    label: 'Cyan' },
  { cls: 'bg-yellow-500',  label: 'Yellow' },
  { cls: 'bg-red-500',     label: 'Red' },
];

export default function Categories() {
  const [name, setName]   = useState('');
  const [color, setColor] = useState('bg-emerald-500');
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setName('');
      toast.success('Category created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), color });
  };

  return (
    <div data-testid="categories-page" className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">Organise your expenses by type</p>
      </div>

      <form onSubmit={handleAdd} className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold">New Category</h3>
        <Input
          data-testid="category-name-input"
          placeholder="Category name..."
          value={name}
          onChange={e => setName(e.target.value)}
          className="rounded-xl h-10 text-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium mr-1">Colour:</span>
          {colorOptions.map(({ cls, label }) => (
            <button
              key={cls}
              type="button"
              title={label}
              onClick={() => setColor(cls)}
              className={cn(
                "w-6 h-6 rounded-full transition-all flex-shrink-0",
                cls,
                color === cls ? "ring-2 ring-offset-2 ring-foreground scale-110" : "opacity-50 hover:opacity-100 hover:scale-105"
              )}
            />
          ))}
        </div>
        <Button data-testid="add-category-btn" type="submit" className="rounded-xl h-10 text-sm" disabled={createMutation.isPending}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </Button>
      </form>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted mb-3">
            <Tags className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first one above</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
          <AnimatePresence>
            {categories.map(cat => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-4 py-3.5 group hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full flex-shrink-0", cat.color || 'bg-primary')} />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <Button
                  data-testid={`delete-category-${cat.name}`}
                  size="icon" variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => deleteMutation.mutate(cat.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
