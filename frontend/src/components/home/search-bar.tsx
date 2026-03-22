import { Container } from '../layout/container';

export function SearchBar() {
  return (
    <Container className="relative z-20 -mt-20 mb-16">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-zinc-100">
        <div className="flex flex-col lg:flex-row items-center divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
          
          <div className="flex w-full flex-1 items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400 w-6 h-6 shrink-0"><path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
            <div className="flex-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Локация</div>
              <input type="text" placeholder="Город, трасса, район..." className="w-full bg-transparent text-sm font-bold text-zinc-900 placeholder-zinc-400 outline-none mt-0.5" />
            </div>
          </div>

          <div className="flex w-full flex-1 items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400 w-6 h-6 shrink-0"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.162 14.54a.75.75 0 0 0 1.118-1.026A18.239 18.239 0 0 1 10.5 12c0-1.505.289-2.924.814-4.204a.75.75 0 0 0-1.393-.56A19.74 19.74 0 0 0 9 12c0 1.706.319 3.313.896 4.76ZM13.88 7.025a.75.75 0 0 0-1.027 1.118A18.239 18.239 0 0 1 13.5 12c0 1.505-.289 2.924-.814 4.204a.75.75 0 0 0 1.393.56A19.74 19.74 0 0 0 15 12c0-1.706-.319-3.313-.896-4.76Z" clipRule="evenodd" /></svg>
            <div className="flex-1 relative">
              <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Тип земли</div>
              <select className="w-full appearance-none bg-transparent text-sm font-bold text-zinc-900 outline-none cursor-pointer mt-0.5">
                <option value="">Любой тип</option>
                <option value="ИЖС">ИЖС (Для дома)</option>
                <option value="Дача">Дачный участок</option>
                <option value="Коммерция">Коммерческий</option>
                <option value="Сельхоз">Сельхоз</option>
              </select>
            </div>
          </div>

          <div className="flex w-full flex-1 items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400 w-6 h-6 shrink-0"><path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" /><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" /></svg>
            <div className="flex-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Бюджет, ₸</div>
              <input type="text" placeholder="До скольки?" className="w-full bg-transparent text-sm font-bold text-zinc-900 placeholder-zinc-400 outline-none mt-0.5" />
            </div>
          </div>

          <div className="w-full lg:w-auto p-2">
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-light hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" /></svg>
              <span>Поиск</span>
            </button>
          </div>

        </div>
      </div>
    </Container>
  );
}
