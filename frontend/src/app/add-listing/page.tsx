'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { pushDataLayer } from '@/lib/analytics';

const LAND_TYPES = ['ИЖС', 'Дача', 'Коммерция', 'Сельхоз'];
const PURPOSES = ['ИЖС', 'ЛПХ', 'Коммерция', 'Сельхоз'];
const RELIEF_TYPES = ['Ровный', 'Под уклон'];

export default function AddListingPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    landType: '',
    purpose: '',
    area: '',
    price: '',
    region: '',
    city: '',
    address: '',
    cadastralNumber: '',
    isPledged: false,
    hasStateAct: true,
    isDivisible: false,
    isOnRedLine: false,
    reliefType: '',
    hasElectricity: false,
    hasGas: false,
    hasWater: false,
    hasSewer: false,
    hasRoadAccess: false,
    description: '',
    name: '',
    phone: '',
    whatsapp: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, landType: type, purpose: type }));
  };

  useEffect(() => {
    pushDataLayer('add_listing_open');
  }, []);

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Укажите заголовок';
    if (!formData.area || Number(formData.area) <= 0) newErrors.area = 'Укажите площадь';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Укажите цену';
    if (!formData.phone.trim()) newErrors.phone = 'Укажите телефон';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushDataLayer('add_listing_submit_attempt');
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      pushDataLayer('add_listing_submit_error', { form: 'add_listing' });
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    // TODO: replace with real API call
    console.log('>>> SUBMIT PUBLISH:', formData);
    pushDataLayer('add_listing_submit_success', { form: 'add_listing' });
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('>>> SUBMIT DRAFT:', formData);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-primary-soft">
      
      <div className="py-10 lg:py-16 pb-32">
        <Container>
          
          <div className="mb-8 max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Назад
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Подать объявление</h1>
            <p className="mt-3 text-lg font-medium text-zinc-500">
              Заполните детали о вашем участке, чтобы покупатели могли быстро вас найти.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
            
            {/* БЛОК 1: Основная информация */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-6">Основная информация</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Заголовок объявления <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="title" required
                    placeholder="Например: Участок 10 соток под строительство дома"
                    value={formData.title} onChange={handleChange}
                    className={`w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${errors.title ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`}
                  />
                  {errors.title && <p className="mt-1 text-sm font-medium text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-3">Тип участка <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {LAND_TYPES.map(type => (
                      <button
                        key={type} type="button"
                        onClick={() => handleTypeSelect(type)}
                        className={`rounded-2xl px-5 py-2.5 text-sm font-bold border transition-all ${
                          formData.landType === type 
                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Площадь (соток) <span className="text-red-500">*</span></label>
                    <input
                      type="number" name="area" required min="1"
                      placeholder="Например: 6"
                      value={formData.area} onChange={handleChange}
                      className={`w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${errors.area ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`}
                    />
                    {errors.area && <p className="mt-1 text-sm font-medium text-red-500">{errors.area}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Цена (₸) <span className="text-red-500">*</span></label>
                    <input
                      type="number" name="price" required min="1"
                      placeholder="Например: 15000000"
                      value={formData.price} onChange={handleChange}
                      className={`w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${errors.price ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`}
                    />
                    {errors.price && <p className="mt-1 text-sm font-medium text-red-500">{errors.price}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* БЛОК 2: Фото */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Фотографии</h2>
              <p className="text-sm font-medium text-zinc-500 mb-6">Объявления с качественными фото получают в 5 раз больше откликов.</p>

              <label className="flex flex-col items-center justify-center w-full h-48 sm:h-56 rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:bg-zinc-100 hover:border-primary/50 cursor-pointer group">
                <div className="h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-primary"><path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-sm font-bold text-zinc-700">Нажмите или перетащите фото сюда</span>
                <span className="text-xs font-semibold text-zinc-400 mt-2">JPG, PNG до 10 МБ</span>
                <input type="file" className="hidden" multiple accept="image/*" />
              </label>
            </div>

            {/* БЛОК Юридические параметры */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-6">Юридические данные и Характеристики</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Кадастровый номер</label>
                    <input 
                      type="text" name="cadastralNumber"
                      placeholder="Например: 20-315-094-111"
                      value={formData.cadastralNumber} onChange={handleChange}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Целевое назначение</label>
                    <select 
                      name="purpose"
                      value={formData.purpose} onChange={handleChange}
                      className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 cursor-pointer"
                    >
                      <option value="" disabled>Выберите назначение</option>
                      {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Рельеф участка</label>
                    <select 
                      name="reliefType"
                      value={formData.reliefType} onChange={handleChange}
                      className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 cursor-pointer"
                    >
                      <option value="" disabled>Выберите рельеф</option>
                      {RELIEF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="hasStateAct" checked={formData.hasStateAct} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                    <span className="text-sm font-bold text-zinc-700">Госакт есть</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="isPledged" checked={formData.isPledged} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                    <span className="text-sm font-bold text-zinc-700">Участок в залоге</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="isDivisible" checked={formData.isDivisible} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                    <span className="text-sm font-bold text-zinc-700">Делимый участок</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" name="isOnRedLine" checked={formData.isOnRedLine} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                    <span className="text-sm font-bold text-zinc-700">На красной линии</span>
                  </label>
                </div>
              </div>
            </div>

            {/* БЛОК 2: Локация */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-6">Расположение</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Регион <span className="text-red-500">*</span></label>
                  <select 
                    name="region" required
                    value={formData.region} onChange={handleChange}
                    className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%2371717A%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_16px_center] bg-no-repeat"
                  >
                    <option value="" disabled>Выберите регион</option>
                    <option value="Алматы">Алматы и область</option>
                    <option value="Астана">Астана и область</option>
                    <option value="Шымкент">Шымкент и область</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Город / Район <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="city" required
                    placeholder="Например: Каскелен"
                    value={formData.city} onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Точный адрес или ориентир</label>
                  <input 
                    type="text" name="address"
                    placeholder="Например: вдоль трассы БАК, поворот направо"
                    value={formData.address} onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* БЛОК 3: Коммуникации */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-6">Коммуникации</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="hasElectricity" checked={formData.hasElectricity} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                  <span className="text-sm font-bold text-zinc-700">Свет заведен</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="hasGas" checked={formData.hasGas} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                  <span className="text-sm font-bold text-zinc-700">Газ подключен</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="hasWater" checked={formData.hasWater} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                  <span className="text-sm font-bold text-zinc-700">Центральная вода</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="hasSewer" checked={formData.hasSewer} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                  <span className="text-sm font-bold text-zinc-700">Канализация</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="hasRoadAccess" checked={formData.hasRoadAccess} onChange={handleChange} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
                  <span className="text-sm font-bold text-zinc-700">Дорога (асфальт)</span>
                </label>
              </div>
            </div>

            {/* БЛОК 4: Описание */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-end justify-between mb-6">
                <h2 className="text-xl font-extrabold text-zinc-900">Описание</h2>
                <span className="text-xs font-bold text-zinc-400">{formData.description.length} / 2000</span>
              </div>
              <textarea 
                name="description" rows={5} maxLength={2000}
                placeholder="Расскажите подробнее: какие плюсы, форма участка, документы..."
                value={formData.description} onChange={handleChange}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 resize-none"
              />
            </div>

            {/* БЛОК 6: Контакты */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-6">Ваши контакты</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Имя <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="name" required
                    placeholder="Иван"
                    value={formData.name} onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Телефон <span className="text-red-500">*</span></label>
                  <input
                    type="tel" name="phone" required
                    placeholder="+7 (___) ___ __ __"
                    value={formData.phone} onChange={handleChange}
                    className={`w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${errors.phone ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`}
                  />
                  {errors.phone && <p className="mt-1 text-sm font-medium text-red-500">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">WhatsApp</label>
                  <input 
                    type="tel" name="whatsapp"
                    placeholder="Если отличается"
                    value={formData.whatsapp} onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6 border-t border-zinc-200">
              {isSubmitted ? (
                <div className="w-full rounded-2xl bg-green-50 border border-green-200 px-8 py-5 text-center">
                  <p className="font-extrabold text-green-700">Объявление отправлено на проверку</p>
                  <p className="text-sm font-medium text-green-600 mt-1">Мы свяжемся с вами в течение 24 часов</p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDraft}
                    className="w-full sm:w-auto rounded-2xl border border-zinc-200 px-8 py-4 text-sm font-extrabold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                  >
                    Сохранить как черновик
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-2xl bg-primary px-10 py-4 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? 'Отправка...' : 'Опубликовать объявление'}
                  </button>
                </>
              )}
            </div>

          </form>
        </Container>
      </div>
    </div>
  );
}
