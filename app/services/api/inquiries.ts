import apiService from "./apiClient";

export interface InquiryFormData extends FormData {
  append(name: string, value: string | Blob, fileName?: string): void;
}

// 新增：base64格式的询盘数据接口
export interface InquiryBase64Data {
  image_base64: string;
  image_filename?: string;
  quantity: string | number;
  name?: string;
  material?: string;
  link?: string;
  remark?: string;
}

export interface InquiryResponse {
  inquiry_id: number;
  user_id: number;
  image_url: string;
  quantity: number;
  name: string;
  link: string;
  remark: string;
  material: string;
  status: number;
  create_time: string;
  update_time: string;
}

export interface InquiryResponseData {
    create_time?:string
    image_url?:string
    inquiry_id?:number
    link?:string
    material?:string
    name?:string
    quantity?:number
    remark?:string
    status?:number
    update_time?:string
    user_id?:number
    success?: boolean
    message?: string
    sku_id?: number
    quoted_price_cny?: number
    display_price?: number
    display_currency?: string
}

export interface InquiryResponseDataList {
    items:{
        create_time:string
        image_url:string
        inquiry_id:number
        link:string
        material:string
        name:string
        quantity:number
        remark:string
        status:number
        update_time:string
        user_id:number
        sku_id?: number
        quoted_price_cny?: number
        display_price?: number
        display_currency?: string
    }[]

}



export const inquiriesApi = {
  getInquiries: (page: number,page_size:number,status:number = 0) => apiService.get<InquiryResponseDataList>(`/api/inquiries/?page=${page}&page_size=${page_size}&status=${status}`),
  getInquiry: (inquiry_id: number) => apiService.get<InquiryResponseData>(`/api/inquiries/${inquiry_id}/`),
  createInquiry: (data: InquiryFormData | InquiryBase64Data) => {
    // 判断是FormData还是base64数据
    if (data instanceof FormData) {
      return apiService.upload<InquiryResponseData>("/api/inquiries/", data);
    } else {
      return apiService.post<InquiryResponseData>("/api/inquiries/", data);
    }
  },
  updateInquiry: (id: number, inquiry: InquiryFormData) =>
    apiService.put<InquiryResponse>(`/api/inquiries/${id}/`, inquiry),
  deleteInquiry: (id: number) =>
    apiService.delete<InquiryResponse>(`/api/inquiries/${id}/`),
};
