import { ref, update, get, remove } from 'firebase/database';
import { rtdb } from '../lib/firebase';

export function useRealtimeDatabase() {
  const updateData = async (path: string, data: any) => {
    try {
      const updates = {
        [path]: data
      };
      await update(ref(rtdb), updates);
      return true;
    } catch (error) {
      console.error('Error updating realtime database:', error);
      return false;
    }
  };

  const getData = async (path: string) => {
    try {
      const reference = ref(rtdb, path);
      const snapshot = await get(reference);
      return snapshot.val();
    } catch (error) {
      console.error('Error getting data from realtime database:', error);
      return null;
    }
  };

  const deleteData = async (path: string) => {
    try {
      const reference = ref(rtdb, path);
      await remove(reference);
      return true;
    } catch (error) {
      console.error('Error deleting data from realtime database:', error);
      return false;
    }
  };

  return {
    updateData,
    getData,
    deleteData
  };
}
