import { EventEmitter } from 'events';

export enum ModalPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  URGENT = 3,
}

export enum ModalType {
  UPDATE = 'update',
  BOOST_SUCCESS = 'boost_success',
  BOOSTED_SUCCESS = 'boosted_success',
  SPIN_WHEEL = 'spin_wheel',
  WINNING = 'winning',
  FRIENDS_WITHDRAWAL = 'friends_withdrawal',
  TASK_COMPLETE = 'task_complete',
}

export interface ModalQueueItem {
  id: string;
  type: ModalType;
  priority: ModalPriority;
  data: any;
  onShow?: () => void;
  onClose?: () => void;
  canInterrupt?: boolean; // 是否可以被中断
}

class ModalQueueManager extends EventEmitter {
  private queue: ModalQueueItem[] = [];
  private currentModal: ModalQueueItem | null = null;
  private isProcessing: boolean = false;

  // 添加弹窗到队列
  addModal(modal: ModalQueueItem) {
    console.log('[ModalQueueManager] 添加弹窗:', modal.type, '优先级:', modal.priority);

    // 检查是否已存在相同的弹窗（避免重复）
    if (this.isDuplicateModal(modal)) {
      console.log('[ModalQueueManager] 检测到重复弹窗，跳过添加');
      return;
    }

    // 如果是紧急弹窗（如强制更新），立即显示
    if (modal.priority === ModalPriority.URGENT) {
      this.handleUrgentModal(modal);
      return;
    }

    // 如果当前没有显示弹窗，直接显示
    if (!this.currentModal) {
      this.showModal(modal);
      return;
    }

    // 如果新弹窗优先级更高，且当前弹窗可被中断
    if (modal.priority > this.currentModal.priority && this.currentModal.canInterrupt !== false) {
      // 对于助力成功和好友提现成功这类重要且时效性强的弹窗
      if (modal.type === ModalType.BOOST_SUCCESS || 
          modal.type === ModalType.BOOSTED_SUCCESS ||
          modal.type === ModalType.FRIENDS_WITHDRAWAL) {
        // 将当前弹窗放回队列前面（稍后显示）
        this.queue.unshift(this.currentModal);
        // 立即显示新的高优先级弹窗
        this.emit('hideModal', this.currentModal.id);
        this.showModal(modal);
        return;
      }
    }

    // 否则，根据优先级插入队列
    this.insertByPriority(modal);
  }

  // 处理紧急弹窗
  private handleUrgentModal(modal: ModalQueueItem) {
    // 如果当前正在显示同样是紧急优先级的弹窗
    if (this.currentModal && this.currentModal.priority === ModalPriority.URGENT) {
      // 特殊处理：助力相关和好友提现弹窗需要排队显示
      if ((modal.type === ModalType.BOOST_SUCCESS || 
           modal.type === ModalType.BOOSTED_SUCCESS || 
           modal.type === ModalType.FRIENDS_WITHDRAWAL) &&
          (this.currentModal.type === ModalType.BOOST_SUCCESS || 
           this.currentModal.type === ModalType.BOOSTED_SUCCESS ||
           this.currentModal.type === ModalType.FRIENDS_WITHDRAWAL)) {
        // 将新的弹窗加入队列前面，确保能显示
        this.queue.unshift(modal);
        console.log('[ModalQueueManager] 另一个高优先级弹窗正在显示，新弹窗已加入队列前面');
        return;
      }
    }
    
    // 对于其他情况，清空低优先级队列
    this.queue = this.queue.filter(item => item.priority === ModalPriority.URGENT);
    
    // 如果有当前弹窗且不是紧急优先级，立即关闭
    if (this.currentModal && this.currentModal.priority < ModalPriority.URGENT) {
      this.emit('hideModal', this.currentModal.id);
      // 显示紧急弹窗
      this.showModal(modal);
    } else if (!this.currentModal) {
      // 没有当前弹窗，直接显示
      this.showModal(modal);
    } else {
      // 当前也是紧急弹窗，加入队列前面
      this.queue.unshift(modal);
    }
  }

  // 根据优先级插入队列
  private insertByPriority(modal: ModalQueueItem) {
    // 找到合适的插入位置
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (modal.priority > this.queue[i].priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, modal);
    console.log('[ModalQueueManager] 弹窗已加入队列，当前队列长度:', this.queue.length);
  }

  // 显示弹窗
  private showModal(modal: ModalQueueItem) {
    this.currentModal = modal;
    console.log('[ModalQueueManager] 显示弹窗:', modal.type);
    
    // 触发显示事件
    this.emit('showModal', modal);
    
    // 执行弹窗的 onShow 回调
    if (modal.onShow) {
      modal.onShow();
    }
  }

  // 关闭当前弹窗
  closeCurrentModal() {
    if (!this.currentModal) return;

    console.log('[ModalQueueManager] 关闭弹窗:', this.currentModal.type);
    
    const closedModal = this.currentModal;
    this.currentModal = null;

    // 执行弹窗的 onClose 回调
    if (closedModal.onClose) {
      closedModal.onClose();
    }

    // 处理队列中的下一个弹窗
    this.processNext();
  }

  // 处理下一个弹窗
  private processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    
    // 添加短暂延迟，确保上一个弹窗完全关闭
    setTimeout(() => {
      if (this.queue.length > 0) {
        const nextModal = this.queue.shift()!;
        this.showModal(nextModal);
      }
      this.isProcessing = false;
    }, 300);
  }

  // 清空队列
  clearQueue() {
    this.queue = [];
  }

  // 获取当前弹窗
  getCurrentModal() {
    return this.currentModal;
  }

  // 获取队列长度
  getQueueLength() {
    return this.queue.length;
  }

  // 检查是否有特定类型的弹窗在显示或队列中
  hasModalOfType(type: ModalType): boolean {
    if (this.currentModal?.type === type) return true;
    return this.queue.some(modal => modal.type === type);
  }

  // 检查是否为重复弹窗
  private isDuplicateModal(modal: ModalQueueItem): boolean {
    // 检查当前显示的弹窗
    if (this.currentModal && 
        this.currentModal.type === modal.type &&
        JSON.stringify(this.currentModal.data) === JSON.stringify(modal.data)) {
      return true;
    }

    // 检查队列中的弹窗
    return this.queue.some(queuedModal => 
      queuedModal.type === modal.type &&
      JSON.stringify(queuedModal.data) === JSON.stringify(modal.data)
    );
  }
}

// 导出单例
export const modalQueueManager = new ModalQueueManager();