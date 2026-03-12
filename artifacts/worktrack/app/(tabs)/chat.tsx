import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { ChatMessage, useApp } from "@/context/AppContext";

const ROOMS = [
  { id: "general", name: "General", icon: "hash" },
  { id: "design", name: "Design", icon: "pen-tool" },
  { id: "dev", name: "Dev", icon: "code" },
  { id: "random", name: "Random", icon: "coffee" },
];

const DEMO_NAMES = ["Alex Johnson", "Jamie Lee", "Sam Rivera", "Morgan Chen"];

function MessageBubble({
  message,
  isOwn,
  isDark,
}: {
  message: ChatMessage;
  isOwn: boolean;
  isDark: boolean;
}) {
  const theme = isDark ? Colors.dark : Colors.light;
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const initials = message.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = Colors.projects[
    Math.abs(message.authorId.charCodeAt(0)) % Colors.projects.length
  ];

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && (
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.bubbleWrapper}>
        {!isOwn && (
          <Text style={[styles.authorName, { color: theme.textSecondary }]}>
            {message.authorName}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            isOwn
              ? { backgroundColor: Colors.primary }
              : { backgroundColor: isDark ? Colors.dark.surfaceSecondary : Colors.light.surfaceSecondary },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isOwn ? "#fff" : theme.text }]}>
            {message.text}
          </Text>
        </View>
        <Text style={[styles.bubbleTime, { color: theme.textTertiary }]}>{time}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { chatMessages, sendMessage, currentUser } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [activeRoom, setActiveRoom] = useState("general");
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const roomMessages = chatMessages.filter((m) => m.roomId === activeRoom);

  const handleSend = () => {
    const txt = input.trim();
    if (!txt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(activeRoom, txt);
    setInput("");
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <MessageBubble
      message={item}
      isOwn={item.authorId === currentUser.id}
      isDark={isDark}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Team Chat</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          {ROOMS.find((r) => r.id === activeRoom)?.name || "Chat"}
        </Text>
      </View>

      <View style={[styles.roomTabs, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {ROOMS.map((room) => (
          <Pressable
            key={room.id}
            style={[
              styles.roomTab,
              activeRoom === room.id && { borderBottomColor: Colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveRoom(room.id)}
          >
            <Feather
              name={room.icon as any}
              size={14}
              color={activeRoom === room.id ? Colors.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.roomTabText,
                { color: activeRoom === room.id ? Colors.primary : theme.textSecondary },
              ]}
            >
              {room.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={roomMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: bottomPad + 16 },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={36} color={theme.textTertiary} />
            <Text style={[styles.emptyChatText, { color: theme.textSecondary }]}>
              No messages yet in #{ROOMS.find((r) => r.id === activeRoom)?.name}
            </Text>
            <Text style={[styles.emptyChatSub, { color: theme.textTertiary }]}>
              Be the first to say something!
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: bottomPad + 8,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder={`Message #${ROOMS.find((r) => r.id === activeRoom)?.name}...`}
          placeholderTextColor={theme.textTertiary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          style={[
            styles.sendBtn,
            { backgroundColor: input.trim() ? Colors.primary : theme.surfaceSecondary },
          ]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Feather
            name="send"
            size={18}
            color={input.trim() ? "#fff" : theme.textTertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  roomTabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  roomTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roomTabText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  messageRowOwn: { flexDirection: "row-reverse" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bubbleWrapper: { maxWidth: "75%", gap: 3 },
  authorName: { fontSize: 11, fontFamily: "Inter_500Medium", marginLeft: 4 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 21 },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginLeft: 4 },
  emptyChat: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyChatText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  emptyChatSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
