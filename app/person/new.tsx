import { useRouter } from 'expo-router';
import { usePersonStore } from '../../src/store/personStore';
import PersonForm from '../../src/components/PersonForm';

export default function NewPersonScreen() {
  const add = usePersonStore((s) => s.add);
  const router = useRouter();

  return (
    <PersonForm
      mode="new"
      onSubmit={async (data) => {
        await add(data);
        router.back();
      }}
    />
  );
}
