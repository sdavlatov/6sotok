import { Header } from '@/components/layout/header';
import { Container } from '@/components/layout/container';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Header />
      <main className="py-8">
        <Container>
          <div className="max-w-xl mx-auto rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-center">Профиль</h1>
            <p className="mt-2 text-center text-zinc-600">Здесь будет личный кабинет пользователя</p>
            
            <div className="mt-8 space-y-4">
              <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                <div className="text-sm font-medium text-zinc-500">Имя</div>
                <div className="font-semibold">Иван Иванов</div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                <div className="text-sm font-medium text-zinc-500">Телефон</div>
                <div className="font-semibold">+7 777 123 45 67</div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
