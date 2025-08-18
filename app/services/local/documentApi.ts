import { apiService } from '../api/apiClient';

export interface DocumentUploadRequest {
  image_base64: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  document_type: string;
  document_number: string;
}

class DocumentApi {
  /**
   * 上传身份证文档
   * @param request 包含base64编码的图片数据
   * @returns 上传结果，包含文档类型和文档号码
   */
  async uploadDocument(request: DocumentUploadRequest): Promise<DocumentUploadResponse> {
    try {
      const response = await apiService.post<DocumentUploadResponse>(
        '/api/flash-local/documents/upload/',
        request
      );
      return response;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }
}

export const documentApi = new DocumentApi();