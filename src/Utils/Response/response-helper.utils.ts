import {
  IFailureResponse,
  ISuccessResponse,
} from "../../Common/Interfaces/response.interface";

export function SuccessResponse<T>(
  message = "Your Request Processed Successfully",
  status = 200,
  data?: T
): ISuccessResponse {
  return {
    meta: {
      status,
      success: true,
    },
    data: {
      message,
      data,
    },
  };
}

export function FailedResponse<T>(
  message = "Your Request Is Failed",
  status = 500,
  error?: object
): IFailureResponse {
  return {
    meta: {
      status,
      success: false,
    },
    error: {
      message,
      context: error,
    },
  };
}
