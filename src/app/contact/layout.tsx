import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export default function ContactLayout({ children }: LayoutProps<'/contact'>) {
  return (
    <>
      <SiteNav variant="solid" />
      {children}
      <SiteFooter />
    </>
  );
}
