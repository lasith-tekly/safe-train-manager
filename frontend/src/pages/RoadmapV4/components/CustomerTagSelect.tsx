import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { listFeatures } from '../../../services/featureApi';
import { RoadmapFeature } from '../../../types/roadmap_v4';

interface CustomerTagSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  refreshKey?: number; // Used to trigger refetch when incremented
}

export const CustomerTagSelect: React.FC<CustomerTagSelectProps> = ({
  value,
  onChange,
  refreshKey,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        // Fetch all features across multiple pages to get complete customer list
        let allFeatures: RoadmapFeature[] = [];
        let totalPages = 1;
        
        // Fetch first page to get total count
        const firstResponse = await listFeatures({ page: 1, page_size: 100 });
        allFeatures = firstResponse.data || [];
        const totalFeatures = firstResponse.total || 0;
        totalPages = Math.ceil(totalFeatures / 100);
        
        // Fetch remaining pages if needed
        if (totalPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(listFeatures({ page, page_size: 100 }));
          }
          
          const responses = await Promise.all(pagePromises);
          responses.forEach(response => {
            allFeatures = allFeatures.concat(response.data || []);
          });
        }
        
        console.log('CustomerTagSelect - fetched features:', allFeatures.length);
        
        // Extract unique customers from all features
        const uniqueCustomers = [...new Set(
          allFeatures
            .map((f: RoadmapFeature) => f.customer)
            .filter((c): c is string => Boolean(c))
            .flatMap((c: string) => c.split(',').map(s => s.trim()))
        )] as string[];
        
        console.log('CustomerTagSelect - unique customers:', uniqueCustomers);
        setOptions(uniqueCustomers.sort());
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [refreshKey]); // Refetch when refreshKey changes

  const handleChange = (values: string[]) => {
    // Join multiple selections with comma for storage
    const joinedValue = values.join(', ');
    onChange?.(joinedValue);
  };

  // Parse current value back to array
  const currentValues = value 
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const placeholder = loading 
    ? 'Loading customers...' 
    : options.length > 0 
      ? `Select from ${options.length} customer(s) or type new` 
      : 'Type customer name(s) and press Enter';

  return (
    <Select
      mode="tags"
      placeholder={placeholder}
      value={currentValues}
      onChange={handleChange}
      loading={loading}
      tokenSeparators={[',', ';']}
      maxTagCount="responsive"
      allowClear
      showSearch
      filterOption={(input, option) =>
        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
      }
      notFoundContent={loading ? 'Loading...' : null}
      style={{ width: '100%' }}
    >
      {options.map(customer => (
        <Select.Option key={customer} value={customer}>
          {customer}
        </Select.Option>
      ))}
    </Select>
  );
};
