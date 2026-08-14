import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { fetchItems } from '../services/api';

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('All');

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchItems();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Filter & Search Logic
  const filteredItems = items.filter((item) => {
    const matchesType = activeType === 'all' || item.type === activeType;
    const matchesCampus = selectedCampus === 'All' || item.campus === selectedCampus;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesCampus && matchesQuery;
  });

  const handleContact = (item) => {
    const subject = encodeURIComponent(`[BITS Lost & Found] Regarding: ${item.title}`);
    const body = encodeURIComponent(
      `Hi,\n\nI saw your listing for "${item.title}" on the BITS Lost & Found App.\n\nItem Location: ${item.location} (${item.campus})\n\nPlease let me know how we can connect.`
    );
    Linking.openURL(`mailto:${item.contact_email}?subject=${subject}&body=${body}`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.type === 'lost' ? styles.lostBorder : styles.foundBorder]}
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, item.type === 'lost' ? styles.lostBadge : styles.foundBadge]}>
          <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>

      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      ) : null}

      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.meta}>📍 {item.location} ({item.campus})</Text>
        <Text style={styles.tapPrompt}>Tap for details ➔</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search items, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Type Filters */}
      <View style={styles.filterRow}>
        {['all', 'lost', 'found'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typePill, activeType === type && styles.typePillActive]}
            onPress={() => setActiveType(type)}
          >
            <Text style={[styles.typeText, activeType === type && styles.whiteText]}>
              {type.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campus Selector Chips */}
      <View style={styles.campusContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campusRow}>
          {['All', 'Pilani', 'Goa', 'Hyderabad', 'Dubai'].map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.campusChip, selectedCampus === c && styles.campusChipActive]}
              onPress={() => setSelectedCampus(c)}
            >
              <Text style={[styles.campusText, selectedCampus === c && styles.whiteText]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Item List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0056b3" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadItems}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadItems}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No items found matching your criteria.</Text>
            </View>
          }
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal animationType="slide" transparent={true} visible={!!selectedItem} onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <View style={styles.modalHeader}>
                  <View style={[styles.badge, selectedItem.type === 'lost' ? styles.lostBadge : styles.foundBadge]}>
                    <Text style={styles.badgeText}>{selectedItem.type.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{selectedItem.title}</Text>

                {selectedItem.image_url ? (
                  <Image source={{ uri: selectedItem.image_url }} style={styles.modalImage} resizeMode="cover" />
                ) : null}

                <View style={styles.modalDetailBox}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailBody}>{selectedItem.description}</Text>
                </View>

                <View style={styles.modalDetailBox}>
                  <Text style={styles.detailLabel}>Location & Campus</Text>
                  <Text style={styles.detailBody}>📍 {selectedItem.location} • {selectedItem.campus} Campus</Text>
                </View>

                <View style={styles.modalDetailBox}>
                  <Text style={styles.detailLabel}>Contact Person</Text>
                  <Text style={styles.detailBody}>✉️ {selectedItem.contact_email}</Text>
                </View>

                <TouchableOpacity style={styles.contactButton} onPress={() => handleContact(selectedItem)}>
                  <Text style={styles.contactButtonText}>📧 EMAIL OWNER / FINDER</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e1e8ed' },
  searchInput: { backgroundColor: '#f0f3f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  filterRow: { flexDirection: 'row', padding: 8, backgroundColor: '#fff', gap: 6 },
  typePill: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#f0f3f5' },
  typePillActive: { backgroundColor: '#0056b3' },
  typeText: { fontSize: 11, fontWeight: 'bold', color: '#657786' },
  whiteText: { color: '#fff' },
  campusContainer: { backgroundColor: '#fff', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e1e8ed' },
  campusRow: { paddingHorizontal: 8, gap: 6 },
  campusChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: '#f0f3f5' },
  campusChipActive: { backgroundColor: '#17bf63' },
  campusText: { fontSize: 12, color: '#555', fontWeight: '500' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  lostBorder: { borderLeftWidth: 5, borderLeftColor: '#e0245e' },
  foundBorder: { borderLeftWidth: 5, borderLeftColor: '#17bf63' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#14171a', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  lostBadge: { backgroundColor: '#fde8ed' },
  foundBadge: { backgroundColor: '#e1f5fe' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  cardImage: { width: '100%', height: 140, borderRadius: 8, marginVertical: 8 },
  description: { fontSize: 13, color: '#4b5563', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f3f5', paddingTop: 8 },
  meta: { fontSize: 12, color: '#657786' },
  tapPrompt: { fontSize: 11, color: '#0056b3', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#e0245e', marginBottom: 12 },
  emptyText: { color: '#657786', fontSize: 14 },
  retryButton: { backgroundColor: '#0056b3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeButton: { padding: 6 },
  closeText: { fontSize: 18, fontWeight: 'bold', color: '#657786' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  modalImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  modalDetailBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 10 },
  detailLabel: { fontSize: 11, fontWeight: 'bold', color: '#657786', textTransform: 'uppercase', marginBottom: 2 },
  detailBody: { fontSize: 14, color: '#1f2937' },
  contactButton: { backgroundColor: '#0056b3', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});