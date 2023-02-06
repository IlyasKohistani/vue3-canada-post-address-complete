<template>
    <div class="form-group">
        <v-select
            class="w-100 remove-icons"
            :placeholder="placeholder || $t('address')"
            :value="selectValue"
            :options="options"
            :noDrop="options.length == 0"
            :loading="isLoading"
            :closeOnSelect="isClosableOnSelect"
            @option:selected="optionSelected"
            autocomplete="address_no_auto_complete"
            :name="placeholder || $t('address')"
            label="Text"
            :filter="filterOptions"
            @search="tquery">
            <template v-slot:option="option">
                <span class="d-flex align-items-center" @click="isClosableOnSelect = option.Next == 'Retrieve'">
                    <b-icon-globe class="align-middle mr-2 text-primary" v-if="option.resetCountryOption"/>
                    <b-icon-geo-alt-fill class="align-middle mr-2 text-primary" v-else/>
                    <i class="i-size-md align-middle mr-2 text-primary" ></i>
                    <span>{{ option.Text }} {{ option.Description }}</span> 
                    <span class="text-primary cursor-pointer ml-1" v-if="option.resetCountryOption">({{ $t('Update') }})</span>
                    <b-icon-chevron-right class="align-middle ml-auto text-primary" v-if="option.Next == 'Find'"/>
                </span>
            </template>
            <template v-slot:selected-option="option">
                <b-icon-geo-alt-fill class="align-middle mr-2 text-primary"/>
                {{ option.Text }} {{fullAddress ? option.Description : ''}}
            </template>
            <template #no-options>
                <div class="text-center text-sm py-3">
                    <template  v-if="editingCountry">
                        <span>{{ $t('no_country_found') }}</span>
                    </template>
                    <template v-else> 
                        <span>{{ $t('no_address_found_in_country').replace(':COUNTRY', selectedCountry.Text) }}</span>
                        <span class="text-primary cursor-pointer ml-2" @click="editingCountry = true">({{ $t('Update') }})</span>
                    </template>
                </div>
            </template>
        </v-select>
    </div>
</template>

<script>
import {ref, computed, watch} from "vue";
import axios from "axios";
import countries from 'iso3166-lookup/dist/countries';
import { useI18n } from "vue-i18n";
import _ from 'lodash'

export default {
    props: {
        value: {
            type: String,
            default: '',
            description: 'The select value'
        },
        invalid: {
            type: Boolean,
            default: false,
            description: 'Mark select as valid|invalid'
        },
        populateDetail: {
            type: Boolean,
            default: false,
            description: 'After selecting an address retrieve details and emit("update-address-detail", address-detail)'
        },
        placeholder: {
            type: String,
            default: '',
            description: 'Select placeholder text'
        },
        countryCode: {
            type: String,
            description: 'User selected country in which they search for an address'
        },
        fullAddress: {
            type: Boolean,
            default: false,
            description: 'Appends city, province, postal-code to the address'
        },
        withCountryPicker: {
            type: Boolean,
            default: true,
            description: 'Allow user to pick country | update country in which they are searching'
        },
        // For details about canada post api visit https://www.canadapost-postescanada.ca/ac/support/api/
        /** EVENTS
         *  emit('update-address-detail', address-detail)
         *  emit('input', address)
         *  emit('update-country-code', country-code)
        */ 

    },
    setup(props, {emit}) {
        const canadaPostApiKey = process.env.VUE_APP_CANADA_POST_ADDRESS_COMPLETE_API_KEY;
        const canadaPostRetrieveApi = process.env.VUE_APP_CANADA_POST_ADDRESS_COMPLETE_RETRIEVE_API;
        const canadaPostFindApi = process.env.VUE_APP_CANADA_POST_ADDRESS_COMPLETE_FIND_API;
        const { t } = useI18n();
        const addressOptions = ref([]);
        const isLoading = ref(false)
        const isClosableOnSelect = ref(true)
        const activeFindAddress = ref(null)
        const editingCountry = ref(false)
        const selectedCountry = ref({Text: 'Canada', Id: 'CAN'})
        const countryOptions = countries.map(country => { return { Text: country.country, Id: country.alpha3}})

        const query = (v) => {
            if(v == null || v == '' || editingCountry.value) return
            const SearchTerm = v?.Id ? '' : v
            const LastId = v?.Id || ''
            const Country =  selectedCountry.value.Id

            isLoading.value = true
            let params = {
                Key: canadaPostApiKey, SearchTerm, LastId, Country, LanguagePreference: 'EN', MaxSuggestions: 10,
                // SearchFor: SEARCHFOR, MaxResults: MAXRESULTS, Origin: ORIGIN, Bias: BIAS, Filters: FILTERS, GeoFence: GEOFENCE,
            }
            // search for matching addresses
            axios.get(canadaPostFindApi,  { params }).then(({data}) => {
                addressOptions.value = data.Items || [];
                isLoading.value = false
            })
        }

        const updateAddressDetail = (Id) => {
            // update address details like province, country, postal code ....
            axios.get(canadaPostRetrieveApi, { 
                    params: {
                        Key: canadaPostApiKey,
                        Id,
                    }
            }).then(({data}) => {
                if (data.Items.length == 1 && typeof(data.Items[0].Error) != "undefined") {
                    // Show the error message
                    alert(data.Items[0].Description);
                }else if(data.Items.length){
                    // emit our details
                    emit('update-address-detail', data.Items[0])
                }
            })
        }

        // throttled query
        const tquery = _.throttle(query, 600, {leading: false});
        
        const optionSelected =  (v) => {
            // country selection related
            // chose a country an start searching for address in that country
            if(editingCountry.value == true){
                if(v) selectedCountry.value = v
                editingCountry.value = false
                return
            }
            // if select country option clicked then start picking country
            if(v?.resetCountryOption){
                editingCountry.value = true
                return
            }
            // address details related
            // if populateDetail is true and Next value is Retreive we call retrieve api to get address details
            if(props.populateDetail && v?.Next == 'Retrieve'){
                updateAddressDetail(v.Id)
            }
            // if Next value is Find there is more addresses link to this like a block with many aprtments we need to find more addresses
            if(v?.Next == 'Find') {
                activeFindAddress.value = v
                query(v)
            }else {
                activeFindAddress.value = null
                const r = v?.Text && props.fullAddress ? (v?.Text + ' ' + v?.Description) : v?.Text
                emit('input', (r || v))
            }
        }

        const options = computed(() => {
            if(editingCountry.value) return countryOptions
            // include change country option on top if country selection needed do not remove it while searching or filtering
            return props.withCountryPicker 
            ? [{Text: t('search_in_country').replace(':COUNTRY', selectedCountry.value.Text), Description: '', resetCountryOption: true}, ...addressOptions.value]
            : addressOptions.value
        })

        const selectValue = computed(() => {
            // if picking country show current country value
            if(editingCountry.value) return selectedCountry.value.Text
            // if address with LastId then 
            return activeFindAddress.value ? activeFindAddress.value.Text : props.value
        })

        // watch if countryCode update then update selected country
        watch(() => props.countryCode, (newV, oldV) => {
            if(newV != oldV){
                const countryOption = countryOptions.find(c => c.Id == newV)
                if(countryOption) selectedCountry.value = countryOption
            }
        }, {immediate:true})

        // if you try to change country then update options and activeFindAddress
        watch(selectedCountry, (newV, oldV) => {
            if(newV.Text != oldV.Text){
                activeFindAddress.value = null
                addressOptions.value = []
                emit('update-country-code', newV.Id)
            }
        })

        // select filtering
        const filterOptions = (options, search) => {
            let r = options.filter(option => {
                        let label = option.Text + (option?.Description);
                        // add description for wide search
                        if(option?.Description) label += ' ' + option.Description
                        if (typeof label === "number") {
                            label = label.toString();
                        }
                        // filterBy || if resetCountryOption then skip it
                        return option.resetCountryOption == true || (label || '').toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) > -1;
                    });
            // if resetCountryOption the only result then hide it to show no result message
            if(r.length == 1 && r[0]?.resetCountryOption == true) return []
            return r
        }

        return {options, tquery, optionSelected, isLoading, isClosableOnSelect, selectValue, filterOptions, selectedCountry, editingCountry}
    },
}
</script>

<style>
    /* hide v-select icons */
    .v-select.remove-icons .vs__actions > .vs__clear,
    .v-select.remove-icons .vs__actions > .vs__open-indicator {
        display: none !important;
    }
    .v-select.remove-icons .vs__actions:after {
        content: "" !important;
    }
</style>
