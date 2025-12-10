import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../src/renderer/stores/ui.store';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      currentView: 'graph',
      sidebarCollapsed: false,
      diffViewMode: 'unified',
      selectedFile: null,
      selectedStashIndex: null,
      isSearchOpen: false,
      isCreateBranchOpen: false,
      isCommitPanelOpen: true,
      notification: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState();

      expect(state.currentView).toBe('graph');
      expect(state.sidebarCollapsed).toBe(false);
      expect(state.diffViewMode).toBe('unified');
      expect(state.selectedFile).toBeNull();
      expect(state.isSearchOpen).toBe(false);
      expect(state.notification).toBeNull();
    });
  });

  describe('setCurrentView', () => {
    it('should set current view', () => {
      useUIStore.getState().setCurrentView('staging');

      expect(useUIStore.getState().currentView).toBe('staging');
    });

    it('should accept all view types', () => {
      const views = ['graph', 'staging', 'diff', 'branches', 'stashes', 'history', 'blame', 'conflicts', 'search'] as const;

      views.forEach((view) => {
        useUIStore.getState().setCurrentView(view);
        expect(useUIStore.getState().currentView).toBe(view);
      });
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setDiffViewMode', () => {
    it('should set diff view mode', () => {
      useUIStore.getState().setDiffViewMode('split');

      expect(useUIStore.getState().diffViewMode).toBe('split');

      useUIStore.getState().setDiffViewMode('unified');

      expect(useUIStore.getState().diffViewMode).toBe('unified');
    });
  });

  describe('selectFile', () => {
    it('should set selected file', () => {
      useUIStore.getState().selectFile('src/index.ts');

      expect(useUIStore.getState().selectedFile).toBe('src/index.ts');
    });

    it('should clear selected file', () => {
      useUIStore.setState({ selectedFile: 'file.ts' });

      useUIStore.getState().selectFile(null);

      expect(useUIStore.getState().selectedFile).toBeNull();
    });
  });

  describe('selectStash', () => {
    it('should set selected stash index', () => {
      useUIStore.getState().selectStash(2);

      expect(useUIStore.getState().selectedStashIndex).toBe(2);
    });

    it('should clear selected stash', () => {
      useUIStore.setState({ selectedStashIndex: 1 });

      useUIStore.getState().selectStash(null);

      expect(useUIStore.getState().selectedStashIndex).toBeNull();
    });
  });

  describe('toggleSearch', () => {
    it('should toggle search panel', () => {
      expect(useUIStore.getState().isSearchOpen).toBe(false);

      useUIStore.getState().toggleSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(true);

      useUIStore.getState().toggleSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(false);
    });
  });

  describe('toggleCreateBranch', () => {
    it('should toggle create branch modal', () => {
      expect(useUIStore.getState().isCreateBranchOpen).toBe(false);

      useUIStore.getState().toggleCreateBranch();
      expect(useUIStore.getState().isCreateBranchOpen).toBe(true);

      useUIStore.getState().toggleCreateBranch();
      expect(useUIStore.getState().isCreateBranchOpen).toBe(false);
    });
  });

  describe('toggleCommitPanel', () => {
    it('should toggle commit panel', () => {
      expect(useUIStore.getState().isCommitPanelOpen).toBe(true);

      useUIStore.getState().toggleCommitPanel();
      expect(useUIStore.getState().isCommitPanelOpen).toBe(false);

      useUIStore.getState().toggleCommitPanel();
      expect(useUIStore.getState().isCommitPanelOpen).toBe(true);
    });
  });

  describe('notifications', () => {
    it('should show notification', () => {
      useUIStore.getState().showNotification('success', 'Operation completed');

      const state = useUIStore.getState();
      expect(state.notification).toEqual({
        type: 'success',
        message: 'Operation completed',
      });
    });

    it('should show error notification', () => {
      useUIStore.getState().showNotification('error', 'Something went wrong');

      expect(useUIStore.getState().notification).toEqual({
        type: 'error',
        message: 'Something went wrong',
      });
    });

    it('should show info notification', () => {
      useUIStore.getState().showNotification('info', 'FYI');

      expect(useUIStore.getState().notification).toEqual({
        type: 'info',
        message: 'FYI',
      });
    });

    it('should clear notification', () => {
      useUIStore.setState({ notification: { type: 'success', message: 'Test' } });

      useUIStore.getState().clearNotification();

      expect(useUIStore.getState().notification).toBeNull();
    });
  });
});

