// Blog do tema "Painel" — TEMPORÁRIO.
//
// O chrome (header/rodapé) já é o deste tema, mas o miolo ainda reusa o
// componente de blog do tema padrão, porque os dados do blog (posts,
// comentários, taxonomia, SEO) continuam morando dentro dele.
//
// Este é o único ponto do tema que importa de outro tema, e existe só para o
// /blog não ficar quebrado enquanto a extração de useBlogData/useBlogSeo não
// acontece. Assim que ela entrar, o miolo passa a ser marcação própria daqui e
// este import some.

import { useNavigate } from 'react-router-dom';
import { ThemeBlogProps } from '../../types';
import SharedBlogFeed from '../../default/sections/BlogView';
import JapHeader from '../chrome/Header';
import JapFooter from '../chrome/Footer';

export default function JapBlogView({ company, siteName, logoUrl }: ThemeBlogProps) {
  const navigate = useNavigate();

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  return (
    <div className="jap-page min-h-screen flex flex-col">
      <JapHeader siteName={siteName} logoUrl={logoUrl} onNavigate={goHome} />

      <main className="pt-[71px] md:pt-[91px] lg:pt-[111px] flex-1">
        <SharedBlogFeed onNavigate={goHome} siteName={siteName} logoUrl={logoUrl} />
      </main>

      <JapFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
    </div>
  );
}
