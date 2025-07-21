import { useEffect, useState, useCallback } from 'react';
import { modalQueueManager, ModalQueueItem, ModalType, ModalPriority } from '../utils/modalQueueManager';

interface UseModalQueueProps {
  modalId: string;
  modalType: ModalType;
  priority?: ModalPriority;
  canInterrupt?: boolean;
}

export function useModalQueue({ 
  modalId, 
  modalType, 
  priority = ModalPriority.MEDIUM,
  canInterrupt = true 
}: UseModalQueueProps) {
  const [visible, setVisible] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  useEffect(() => {
    // 监听显示事件
    const handleShowModal = (modal: ModalQueueItem) => {
      if (modal.id === modalId) {
        setModalData(modal.data);
        setVisible(true);
      }
    };

    // 监听隐藏事件（被高优先级中断）
    const handleHideModal = (hideModalId: string) => {
      if (hideModalId === modalId) {
        setVisible(false);
      }
    };

    modalQueueManager.on('showModal', handleShowModal);
    modalQueueManager.on('hideModal', handleHideModal);

    return () => {
      modalQueueManager.off('showModal', handleShowModal);
      modalQueueManager.off('hideModal', handleHideModal);
    };
  }, [modalId]);

  // 显示弹窗
  const showModal = useCallback((data?: any) => {
    const modal: ModalQueueItem = {
      id: modalId,
      type: modalType,
      priority,
      data,
      canInterrupt,
    };

    modalQueueManager.addModal(modal);
  }, [modalId, modalType, priority, canInterrupt]);

  // 关闭弹窗
  const closeModal = useCallback(() => {
    setVisible(false);
    // 延迟一点时间，确保关闭动画完成
    setTimeout(() => {
      modalQueueManager.closeCurrentModal();
    }, 200);
  }, []);

  return {
    visible,
    modalData,
    showModal,
    closeModal,
  };
}