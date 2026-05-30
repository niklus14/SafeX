import { MapPin } from 'lucide-react';
import { useApp } from '../store';

const SLIDES = [
  {
    title: 'Problemi gör, şəkil çək',
    text: 'Şəhərimizdə gördüyünüz istənilən çatışmazlığı bircə kliklə qeydə alın.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsqWwcbOj6sVL--9UqoWekC02Kwu9fzioGQ6p3p2DiDENzLnfrqzdZYejDqi3n_3y4OpUzORlTLhuCex-TVl3PAbPF_EsRA9RMwMz-GEl8OL6CUUFMjbVfoHckwCEULlx1txzz4YeXlh4VtqWUawsrTNDy5AJtibo2EJqTbhHVYqs1Nu60uf6YEhzePWh_0fLPWHlhOFF702MfUoTXfzpUe8lSnehwNnRK9Bv3cVR2YNx4HUipEJm1xS7I0JvQ-ACSDFnVe6KQnzk',
  },
  {
    title: 'Süni intellekt avtomatik təyin edir',
    text: 'Ağıllı sistemimiz problemi dərhal analiz edib aidiyyatı quruma yönləndirir.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCL21J4rnrVE2wYiSLuK8F5uIgm47q7CGYRBCVM3BQKbLvivzxp69sV-Y6haBDk7lA80oZS83rmFVjNexURYfiX7htSCIQMulYIxZ4hOJG9Yf1BTBICy0Rvd01Np8MRPrhNoHYA56AbvXE4CrSCCL_TfpVnYrIiMCZ9qEwvuVNka4QD-XN6OWGORnFGzaGkifre_ygV_3DyAXUYcD8FgSS9aDFrcun2qFRhPyyrgWxysB3tfbND7LCMBBtuKMNn4uvnItUd-x9TrI',
  },
  {
    title: 'Birlikdə həll edirik',
    text: 'Problemin həllinə nəzarət edin və şəhərimizin inkişafına töhfə verin.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJjRv5owZC83lgMOFT3TEE7Qx0eNZR9mwCGzTvJyDewE3XXdVqfOYtJIut7-vMTVpPAy3RnJVIvbcfGyFaD7LfISm05pEmlbSiytCQbFun5ISg2GbA5UVFh2mZvv2Tb2dE1y8oK1lMGn5SufcM6mVnYsF7bAVJhRI69cGre_jFG_uMGDhX29taZ2S4qz9LKoQrNktkTXvHVIg3GsZBXsXdebqSdiBfb9ftLSj_AlnNnrCs3-R71rGwGOo9Yf7N_9TyoRo9065sT28',
  },
];

export default function OnboardingScreen() {
  const { state, dispatch, navigate } = useApp();
  const { carouselIndex } = state;

  function next() {
    if (carouselIndex < SLIDES.length - 1) {
      dispatch({ type: 'SET_CAROUSEL', index: carouselIndex + 1 });
    } else {
      navigate('permissions');
    }
  }

  const slide = SLIDES[carouselIndex];

  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-br from-[#bd0e21] to-[#870012] flex flex-col justify-between p-6">
      {/* Logo */}
      <div className="mt-8 flex justify-center gap-2">
        <MapPin className="text-white" size={28} />
        <span className="font-display font-extrabold text-2xl text-white tracking-tight">Openwave</span>
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-6">
        <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center p-4 border border-white/20 mb-8 backdrop-blur-md">
          <img
            className="w-48 h-48 object-contain rounded-2xl drop-shadow-lg"
            src={slide.image}
            alt="Onboarding"
          />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white tracking-tight mb-3">
          {slide.title}
        </h1>
        <p className="text-sm text-white/80 max-w-xs leading-relaxed font-medium">
          {slide.text}
        </p>
      </div>

      {/* Dots + CTA */}
      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => dispatch({ type: 'SET_CAROUSEL', index: i })}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === carouselIndex ? 'w-6 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full max-w-xs h-14 bg-white text-brand-primary font-bold rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 text-base cursor-pointer hover:bg-[#ffe9e7]"
        >
          Davam et
        </button>
      </div>
    </div>
  );
}
