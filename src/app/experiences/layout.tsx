import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export default function ExperiencesLayout({ children }: LayoutProps<'/experiences'>) {
  return (
    <>
      <SiteNav variant="solid" />
      {children}
      <SiteFooter />
    </>
  );
}
