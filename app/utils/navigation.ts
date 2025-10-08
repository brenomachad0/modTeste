// Utilitários de navegação para o Sistema MOD

export class NavigationHelper {
  /**
   * Navegar para detalhes do serviço
   */
  static goToServiceDetail(serviceId: string, router?: any) {
    const url = `/servicos/${serviceId}`;
    
    if (router) {
      router.push(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Navegar para detalhes da entrega
   */
  static goToDeliveryDetail(deliveryId: string, router?: any) {
    const url = `/entregas/${deliveryId}`;
    
    if (router) {
      router.push(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Navegar para detalhes do projeto
   */
  static goToProjectDetail(projectId: string, router?: any) {
    const url = `/projetos/${projectId}`;
    
    if (router) {
      router.push(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Voltar ao dashboard principal
   */
  static goToDashboard(router?: any) {
    const url = '/';
    
    if (router) {
      router.push(url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Construir breadcrumb baseado na navegação atual
   */
  static buildBreadcrumb(path: string) {
    const segments = path.split('/').filter(Boolean);
    const breadcrumb = [];

    // Dashboard é sempre o primeiro
    breadcrumb.push({
      label: 'Dashboard',
      href: '/',
      isActive: segments.length === 0
    });

    // Interpretar segmentos
    if (segments[0] === 'projetos' && segments[1]) {
      breadcrumb.push({
        label: `Projeto ${segments[1]}`,
        href: `/projetos/${segments[1]}`,
        isActive: segments.length === 2
      });

      if (segments[2] === 'entregas' && segments[3]) {
        breadcrumb.push({
          label: `Entrega ${segments[3]}`,
          href: `/projetos/${segments[1]}/entregas/${segments[3]}`,
          isActive: segments.length === 4
        });
      }
    }

    if (segments[0] === 'entregas' && segments[1]) {
      breadcrumb.push({
        label: `Entrega ${segments[1]}`,
        href: `/entregas/${segments[1]}`,
        isActive: segments.length === 2
      });
    }

    if (segments[0] === 'servicos' && segments[1]) {
      breadcrumb.push({
        label: `Serviço ${segments[1]}`,
        href: `/servicos/${segments[1]}`,
        isActive: segments.length === 2
      });
    }

    return breadcrumb;
  }
}

export default NavigationHelper;