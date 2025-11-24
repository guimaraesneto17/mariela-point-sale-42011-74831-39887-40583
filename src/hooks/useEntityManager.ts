import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface EntityManagerOptions<T> {
  entityName: string;
  api: {
    getAll: () => Promise<T[]>;
    create: (data: any) => Promise<T>;
    update: (id: string, data: any) => Promise<T>;
    delete: (id: string) => Promise<void>;
  };
  getEntityId: (entity: T) => string;
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}

export function useEntityManager<T>(options: EntityManagerOptions<T>) {
  const { entityName, api, getEntityId, successMessages } = options;
  
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAll();
      setEntities(data);
    } catch (error: any) {
      toast.error(`Erro ao carregar ${entityName}`, {
        description: error.message || "Verifique sua conexão",
      });
    } finally {
      setLoading(false);
    }
  }, [api, entityName]);

  const createEntity = useCallback(async (data: any) => {
    try {
      await api.create(data);
      toast.success(successMessages?.create || `${entityName} criado com sucesso!`);
      await loadEntities();
      setDialogOpen(false);
      return true;
    } catch (error: any) {
      toast.error(`Erro ao criar ${entityName}`, {
        description: error.message,
      });
      return false;
    }
  }, [api, entityName, loadEntities, successMessages]);

  const updateEntity = useCallback(async (id: string, data: any) => {
    try {
      await api.update(id, data);
      toast.success(successMessages?.update || `${entityName} atualizado com sucesso!`);
      await loadEntities();
      setDialogOpen(false);
      return true;
    } catch (error: any) {
      toast.error(`Erro ao atualizar ${entityName}`, {
        description: error.message,
      });
      return false;
    }
  }, [api, entityName, loadEntities, successMessages]);

  const deleteEntity = useCallback(async (entity: T) => {
    try {
      await api.delete(getEntityId(entity));
      toast.success(successMessages?.delete || `${entityName} excluído com sucesso!`);
      await loadEntities();
      return true;
    } catch (error: any) {
      toast.error(`Erro ao excluir ${entityName}`, {
        description: error.message,
      });
      return false;
    }
  }, [api, entityName, getEntityId, loadEntities, successMessages]);

  const openDialog = useCallback((entity?: T) => {
    setSelectedEntity(entity || null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedEntity(null);
    setDialogOpen(false);
  }, []);

  return {
    entities,
    loading,
    selectedEntity,
    dialogOpen,
    loadEntities,
    createEntity,
    updateEntity,
    deleteEntity,
    openDialog,
    closeDialog,
    setSelectedEntity,
  };
}
