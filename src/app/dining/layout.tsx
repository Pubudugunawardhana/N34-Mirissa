import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export default function DiningLayout({ children }: LayoutProps<'/dining'>) {
  return (
    <>
      <SiteNav variant="solid" />
      {children}
      <SiteFooter />
    </>
  );
}
