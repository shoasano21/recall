import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLogStore } from '../../../../src/store/logStore';
import LogForm from '../../../../src/components/LogForm';

export default function NewLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <LogForm
      mode="new"
      onSubmit={async (data) => {
        await useLogStore.getState().add({ ...data, personId: id });
        router.back();
      }}
    />
  );
}
