// Shared query keys
export {
  adminShopProfilesQueryRoot,
  shopRestaurantEditQueryRoot,
  adminShopProfilesManageListIncludes,
  adminShopProfilesBareListIncludes,
  shopOperatingHoursQueryRoot,
  shopRestaurantEditQueryKey,
  adminShopProfilesQueryKey,
  shopOperatingHoursQueryKey,
  type AdminShopProfileListIncludes,
} from './shared/adminShopProfilesQueryKeys';

// Restaurant create/edit form
export { useCreateShopRestaurant } from './restaurant-form/useCreateShopRestaurant';
export type {
  CreateShopRestaurantUiState,
  CreateShopRestaurantActions,
  UseCreateShopRestaurantResult,
} from './restaurant-form/useCreateShopRestaurant';
export { useShopRestaurantForm, defaultShopFormValues, createModeShopFormValues } from './restaurant-form/useShopRestaurantForm';
export {
  useCreateShopMutation,
  useUpdateShopMutation,
  useShopRestaurantEditQuery,
  fetchShopRestaurantEditBundle,
  createShopMutationKey,
  updateShopMutationKey,
  type ShopRestaurantEditBundle,
} from './restaurant-form/mutations';
export {
  appendCreateAdminShopProfileFields,
  buildShopRestaurantSubmitFormData,
  shopFormValuesToAdminProfileFields,
  type AdminShopProfileFormFields,
} from './restaurant-form/buildShopFormData';
export { useShopRestaurantMedia, type ShopRestaurantMediaHydrateInput } from './restaurant-form/useShopRestaurantMedia';
export { useShopRestaurantLocationPickers } from './restaurant-form/useShopRestaurantLocationPickers';
export { useShopRestaurantEditLabels } from './restaurant-form/useShopRestaurantEditLabels';
export { useShopRestaurantPaymentMethods } from './restaurant-form/useShopRestaurantPaymentMethods';

// Operating hours
export { useShopOperatingHoursQuery } from './operating-hours/useShopOperatingHoursQuery';
export {
  useUpdateShopOperatingHoursMutation,
  updateShopOperatingHoursMutationKey,
} from './operating-hours/useUpdateShopOperatingHoursMutation';
export {
  defaultOperatingWeek,
  mapApiOperatingHoursToForm,
  buildOperatingHoursUpdateFormData,
} from './operating-hours/operatingHoursForm';

// Shop profiles (list / status)
export { useAdminShopProfilesQuery } from './profiles/useAdminShopProfilesQuery';
export {
  useAdminShopProfilesBareInfiniteFetcher,
  type AdminShopProfileDropdownShop,
} from './profiles/useAdminShopProfilesBareInfiniteFetcher';
export {
  useToggleShopStatusMutation,
  toggleShopStatusMutationKey,
  type ToggleShopStatusVariables,
} from './profiles/useToggleShopStatusMutation';
export { useManageShopRestaurant } from './profiles/useManageShopRestaurant';
export type { ShopActionDialogState } from './profiles/manageShopRestaurantTypes';
export { useDeleteShopMutation, deleteShopMutationKey, type DeleteShopVariables } from './profiles/useDeleteShopMutation';
export { exportAdminShopProfilesToExcel } from './profiles/exportAdminShopProfiles';
