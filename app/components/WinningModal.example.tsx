import React, { useState } from 'react';
import { View, Button } from 'react-native';
import WinningModal from './WinningModal';

// 使用示例
export default function WinningModalExample() {
  const [showModal, setShowModal] = useState(false);

  const handleContinue = () => {
    setShowModal(false);
    // 继续游戏或导航到下一个页面
    console.log('继续游戏...');
  };

  const handleClose = () => {
    setShowModal(false);
    // 关闭弹窗的逻辑
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button title="显示中奖弹窗" onPress={() => setShowModal(true)} />
      
      <WinningModal
        visible={showModal}
        amount="4,000 FCFA"
        onClose={handleClose}
        onContinue={handleContinue}
      />
    </View>
  );
}