<template>
    <!-- Image and text -->
    <nav class="navbar navbar-light bg-light mx-5 my-3">
    <a class="navbar-brand" href="https://www.canadapost-postescanada.ca/ac/">
        <img src="https://www.canadapost-postescanada.ca/ac/wp-content/uploads/2020/12/addcomppostlogo.png" class="d-inline-block align-top" alt="">
    </a>
    </nav>
    <div class="container p-5">
        <div class="mb-3">
            <h3 >Capture the right address every time with real-time verification</h3>
            <p>Implementing Canada Post address complete with country selection combo. First example search for an address in the selected country. Fill address detail after address selection.</p>
        </div>
        <AddressForm />
        <div class="mb-3 mt-3">
            <h3 >Full Address without detail</h3>
            <p>Second example search for an address in the selected country. Select an address and update only address value.</p>
        </div>
        <AddressSearchInput v-model="data.fullAddress" :fullAddress="true" :populateDetail="false" :placeholder="$t('Address Without Detail')"/>
        <div class="mb-3 mt-3">
            <h3 >Only Line1 from address</h3>
            <p>Second example search for an address in the selected country. Select an address and update only address value.</p>
        </div>
        <AddressSearchInput v-model="data.line1" :fullAddress="false" :populateDetail="false" :placeholder="$t('Line1')"/>
        <div class="mb-3 mt-3">
            <h3 >Without country selection combo</h3>
            <p>You can use this select without country picker. You could set default country or Canada will be used as default country by Canada Post Address Complete API. You are still able to use it to fill address detail</p>
        </div>
        <AddressSearchInput v-model="data.noCountryPicker" :populateDetail="false" :countryCode="'CAN'" :withCountryPicker="false"/>
    </div>
</template>

<script>
import AddressForm from './components/AddressForm.vue'
import AddressSearchInput from './components/AddressSearchInput.vue'
import {reactive} from "vue";

export default {
  name: 'App',
  components: {
    AddressForm,
    AddressSearchInput
  },
  setup(){
    const data = reactive({
        fullAddress:'',
        line1:'',
        noCountryPicker: ''
    })
    return {data}
  }
}
</script>