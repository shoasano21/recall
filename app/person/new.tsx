import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { usePersonStore } from '../../src/store/personStore';
import { useLogStore } from '../../src/store/logStore';
import PersonForm from '../../src/components/PersonForm';

export default function NewPersonScreen() {
  const add = usePersonStore((s) => s.add);
  const router = useRouter();
  const newPersonIdRef = useRef<string | null>(null);

  return (
    <PersonForm
      mode="new"
      onSubmit={async (data) => {
        const person = await add(data);
        newPersonIdRef.current = person.id;
        router.back();
      }}
      onLogAdd={async (logData) => {
        if (newPersonIdRef.current) {
          await useLogStore.getState().add({ ...logData, personId: newPersonIdRef.current });
        }
      }}
    />
  );
}
