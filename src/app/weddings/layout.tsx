import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export default function WeddingsLayout({ children }: LayoutProps<'/weddings'>) {
  return (
    <>
      <SiteNav variant="solid" />
      {children}
      <SiteFooter />
    </>
  );
}
