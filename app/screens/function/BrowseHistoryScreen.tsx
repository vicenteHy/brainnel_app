import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import BackIcon from "../../components/BackIcon";
import fontSize from "../../utils/fontsizeUtils";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import widthUtils from "../../utils/widthUtils";

const browseData = [
  {
    id: "1",
    name: "商品名称示例",
    time: "14:32",
    price: 199.0,
    image: "https://via.placeholder.com/60",
  },
  {
    id: "2",
    name: "另一商品示例",
    time: "09:15",
    price: 89.9,
    image: "https://via.placeholder.com/60",
  },
  
];

export function BrowseHistoryScreen() {
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date());

  const [show, setShow] = useState(false);



  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === "ios"); // iOS 会保持显示
    if (selectedDate) {
      setDate(selectedDate);
    }
  };




  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.safeAreaContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <BackIcon size={fontSize(22)} />
          </TouchableOpacity>
          <Text style={styles.title}>浏览历史</Text>
          <View style={styles.placeholder} />
        </View>

        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShow(true)}
        >
          <Text style={styles.dateText}>筛选浏览记录</Text>
        </TouchableOpacity>

        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChange}
          />
        )}

        <FlatList
          data={browseData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.time}>浏览时间：{item.time}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>当前日期没有浏览记录</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaContent: {
    flex: 1,
    paddingTop: 0,
  },
  container: {
    backgroundColor: "#f8f8f8",
    flex: 1,
  },
  header: {
    paddingInline: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: widthUtils(24,24).width,
  },
  title: {
    fontSize: fontSize(20),
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: widthUtils(24,24).width,
  },

  dateInput: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  dateText: {
    fontSize: fontSize(16),
    color: "#333",
  },
  list: {
    gap: 12,
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  image: {
    width: widthUtils(60,60).width,
    height: widthUtils(60,60).height,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontSize: fontSize(16),
    fontWeight: "500",
    flex: 1,
  },
  price: {
    fontSize: fontSize(14),
    fontWeight: "bold",
    color: "#e60012",
    marginLeft: 8,
  },
  time: {
    fontSize: fontSize(12),
    color: "#888",
    marginTop: 4,
  },
  empty: {
    textAlign: "center",
    color: "#aaa",
    fontSize: fontSize(15),
    marginTop: 40,
  },
});
